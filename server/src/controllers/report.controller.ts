import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';

// Helper to get readings in scope for reports
const getReportReadings = async (userId: string, startDate?: string, endDate?: string, readingType?: string) => {
  const whereClause: any = { userId };
  if (startDate || endDate) {
    whereClause.readingDate = {
      ...(startDate ? { gte: String(startDate) } : {}),
      ...(endDate ? { lte: String(endDate) } : {})
    };
  }
  if (readingType) {
    whereClause.readingType = String(readingType);
  }

  return await prisma.sugarReading.findMany({
    where: whereClause,
    orderBy: [{ readingDate: 'desc' }, { readingTime: 'desc' }]
  });
};

const getTamilReadingType = (type: string): string => {
  const typesMap: Record<string, string> = {
    fasting: 'வெறும் வயிறு (உணவிற்கு முன்)',
    before_breakfast: 'காலை உணவிற்கு முன்',
    after_breakfast: 'காலை உணவிற்கு பின்',
    before_lunch: 'மதிய உணவிற்கு முன்',
    after_lunch: 'மதிய உணவிற்கு பின்',
    before_dinner: 'இரவு உணவிற்கு முன்',
    after_dinner: 'இரவு உணவிற்கு பின்',
    bedtime: 'தூங்குவதற்கு முன்',
    random: 'சீரற்ற நேரம்'
  };
  return typesMap[type] || type;
};

export const exportCSV = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { startDate, endDate, readingType, lang } = req.query;
    const isTa = lang === 'ta';

    const readings = await getReportReadings(req.user.id, startDate as string, endDate as string, readingType as string);

    let csvContent = '\uFEFF'; // Add UTF-8 BOM for Excel Tamil rendering support
    if (isTa) {
      csvContent += 'தேதி,பரிசோதனை நேரம்,இரத்த சர்க்கரை அளவு (mg/dL),சோதனை வகை,மருந்து எடுத்தாரா,மருந்து பெயர்,இன்சுலின் அளவு,உணவு குறிப்பு,அறிகுறிகள்,இதர குறிப்புகள்\n';
    } else {
      csvContent += 'Date,Time,Blood Sugar (mg/dL),Reading Type,Medicine Taken,Medicine Name,Insulin Units,Meal Notes,Symptoms,Remarks\n';
    }

    readings.forEach((r) => {
      const typeLabel = isTa ? getTamilReadingType(r.readingType) : r.readingType;
      const row = [
        r.readingDate,
        r.readingTime,
        r.bloodSugar,
        typeLabel,
        r.medicineTaken ? (isTa ? 'ஆம்' : 'Yes') : (isTa ? 'இல்லை' : 'No'),
        `"${(r.medicineName || '').replace(/"/g, '""')}"`,
        r.insulinUnits || '',
        `"${(r.mealNotes || '').replace(/"/g, '""')}"`,
        `"${(r.symptoms || '').replace(/"/g, '""')}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=sugar_readings_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportExcel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { startDate, endDate, readingType, lang } = req.query;
    const isTa = lang === 'ta';

    const readings = await getReportReadings(req.user.id, startDate as string, endDate as string, readingType as string);

    const data = readings.map((r) => {
      const typeLabel = isTa ? getTamilReadingType(r.readingType) : r.readingType;
      
      if (isTa) {
        return {
          'தேதி': r.readingDate,
          'நேரம்': r.readingTime,
          'இரத்த சர்க்கரை (mg/dL)': r.bloodSugar,
          'சோதனை வகை': typeLabel,
          'மருந்து எடுத்தாரா': r.medicineTaken ? 'ஆம்' : 'இல்லை',
          'மருந்தின் பெயர்': r.medicineName || '',
          'இன்சுலின் அளவு': r.insulinUnits || '',
          'உணவு குறிப்பு': r.mealNotes || '',
          'அறிகுறிகள்': r.symptoms || '',
          'இதர குறிப்புகள்': r.remarks || ''
        };
      }

      return {
        'Date': r.readingDate,
        'Time': r.readingTime,
        'Blood Sugar (mg/dL)': r.bloodSugar,
        'Reading Type': r.readingType,
        'Medicine Taken': r.medicineTaken ? 'Yes' : 'No',
        'Medicine Name': r.medicineName || '',
        'Insulin Units': r.insulinUnits || '',
        'Meal Notes': r.mealNotes || '',
        'Symptoms': r.symptoms || '',
        'Remarks': r.remarks || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isTa ? 'சர்க்கரை பதிவுகள்' : 'Readings Log');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sugar_readings_${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportPDF = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { startDate, endDate, readingType, lang } = req.query;
    const isTa = lang === 'ta';

    const userObj = await prisma.user.findUnique({ where: { id: req.user.id } });
    const readings = await getReportReadings(req.user.id, startDate as string, endDate as string, readingType as string);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sugar_readings_report_${Date.now()}.pdf`);

    doc.pipe(res);

    // Register Tamil font if available locally to prevent pdfkit crash with UTF-8
    let fontName = 'Helvetica';
    const windowsFontPath = 'C:\\Windows\\Fonts\\Nirmala.ttf';
    if (isTa && fs.existsSync(windowsFontPath)) {
      doc.registerFont('TamilUnicode', windowsFontPath);
      fontName = 'TamilUnicode';
    }

    doc.font(fontName);

    // Header styling
    const headerTitle = isTa ? 'இரத்த சர்க்கரை அளவு அறிக்கை (Diabetes Tracker)' : 'Diabetes Health Tracker Log';
    const headerSub = isTa ? 'நோயாளி நீண்ட கால மருத்துவப் பதிவு' : 'Personal Long-term Medical Record';

    doc.fillColor('#059669').fontSize(20).text(headerTitle, { align: 'left' });
    doc.fillColor('#4B5563').fontSize(10).text(headerSub, { align: 'left' });
    doc.moveDown();

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown();

    // Profile summary
    if (userObj) {
      const profileLabel = isTa ? 'நோயாளி சுயவிவரம்:' : 'Patient Profile:';
      const nameLabel = isTa ? `பெயர்: ${userObj.name}` : `Name: ${userObj.name}`;
      const ageText = isTa 
        ? `வயது: ${userObj.age || '--'} | எடை: ${userObj.weight ? userObj.weight + ' கிலோ' : '--'} | உயரம்: ${userObj.height ? userObj.height + ' செ.மீ' : '--'}`
        : `Age: ${userObj.age || 'N/A'} | Weight: ${userObj.weight ? userObj.weight + ' kg' : 'N/A'} | Height: ${userObj.height ? userObj.height + ' cm' : 'N/A'}`;
      const typeText = isTa ? `நீரிழிவு வகை: ${userObj.diabetesType || 'வகை 2'}` : `Diabetes Type: ${userObj.diabetesType || 'N/A'}`;
      const rangeText = isTa 
        ? `இலக்கு வரம்புகள் (mg/dL): ${userObj.targetMin} - ${userObj.targetMax}`
        : `Target Ranges: Normal (Green): ${userObj.targetMin} - ${userObj.targetMax} mg/dL`;

      doc.fillColor('#1F2937').fontSize(12).text(profileLabel, { underline: true });
      doc.fontSize(10).text(nameLabel);
      doc.text(ageText);
      doc.text(typeText);
      doc.text(rangeText);
      doc.moveDown();
    }

    // Health Stats
    if (readings.length > 0) {
      const sugars = readings.map((r) => r.bloodSugar);
      const avg = sugars.reduce((a, b) => a + b, 0) / readings.length;
      const hba1c = ((avg + 46.7) / 28.7).toFixed(2);

      const metricsLabel = isTa ? 'அறிக்கை சுருக்கம்:' : 'Report Metrics Summary:';
      const totalText = isTa ? `மொத்த பதிவுகள்: ${readings.length}` : `Total Readings in Scope: ${readings.length}`;
      const avgText = isTa ? `சராசரி இரத்த சர்க்கரை: ${avg.toFixed(1)} mg/dL` : `Average Blood Glucose: ${avg.toFixed(1)} mg/dL`;
      const a1cText = isTa ? `மதிப்பிடப்பட்ட HbA1c: ${hba1c}%` : `Estimated HbA1c: ${hba1c}%`;
      const highText = isTa ? `அதிகபட்ச சர்க்கரை அளவு: ${Math.max(...sugars)} mg/dL` : `Highest Glucose Level: ${Math.max(...sugars)} mg/dL`;
      const lowText = isTa ? `குறைந்தபட்ச சர்க்கரை அளவு: ${Math.min(...sugars)} mg/dL` : `Lowest Glucose Level: ${Math.min(...sugars)} mg/dL`;

      doc.fillColor('#1F2937').fontSize(12).text(metricsLabel, { underline: true });
      doc.fontSize(10).text(totalText);
      doc.text(avgText);
      doc.text(a1cText);
      doc.text(highText);
      doc.text(lowText);
      doc.moveDown();
    }

    // Table Header
    const tableLabel = isTa ? 'சர்க்கரை பதிவுகள் அட்டவணை:' : 'Readings Log Table:';
    doc.fillColor('#1F2937').fontSize(12).text(tableLabel, { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#111827');
    doc.text(isTa ? 'தேதி' : 'Date', 50, tableTop, { bold: true } as any);
    doc.text(isTa ? 'நேரம்' : 'Time', 130, tableTop);
    doc.text(isTa ? 'சர்க்கரை' : 'Glucose (mg/dL)', 200, tableTop);
    doc.text(isTa ? 'வகை' : 'Type', 300, tableTop);
    doc.text(isTa ? 'மருந்து' : 'Medication', 420, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#9CA3AF').stroke();

    let yPosition = tableTop + 25;
    readings.slice(0, 40).forEach((r) => { // limit pdf list to latest 40 for rendering bounds
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50; // top margin of new page
      }
      const typeLabel = isTa ? getTamilReadingType(r.readingType) : r.readingType;
      
      doc.fillColor('#374151');
      doc.text(r.readingDate, 50, yPosition);
      doc.text(r.readingTime, 130, yPosition);
      doc.text(`${r.bloodSugar}`, 200, yPosition);
      // Clean up string limits for rendering
      doc.text(typeLabel.substring(0, 18), 300, yPosition);
      doc.text(r.medicineTaken ? (isTa ? 'ஆம்' : 'Yes') : (isTa ? 'இல்லை' : 'No'), 420, yPosition);

      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).strokeColor('#E5E7EB').stroke();
      yPosition += 22;
    });

    if (readings.length > 40) {
      const footerMsg = isTa 
        ? '* சமீபத்திய 40 பதிவுகள் மட்டுமே காட்டப்படுகின்றன. முழுப் பதிவையும் விரிதாளில் (CSV/Excel) காணவும்.'
        : '* Only displaying latest 40 readings. Export to CSV/Excel for the full clinical logs.';
      doc.fillColor('#9CA3AF').fontSize(8).text(footerMsg, 50, yPosition + 5);
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
