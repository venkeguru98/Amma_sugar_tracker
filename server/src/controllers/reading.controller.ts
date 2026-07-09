import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      readingDate,
      readingTime,
      readingType,
      bloodSugar,
      medicineTaken,
      medicineName,
      insulinUnits,
      mealNotes,
      symptoms,
      remarks,
    } = req.body;

    if (!readingDate || !readingTime || !readingType || bloodSugar === undefined) {
      return res.status(400).json({ error: 'Date, time, reading type, and blood sugar value are required' });
    }

    const reading = await prisma.sugarReading.create({
      data: {
        userId: req.user.id,
        readingDate,
        readingTime,
        readingType,
        bloodSugar: parseFloat(bloodSugar),
        medicineTaken: medicineTaken === true || medicineTaken === 'true',
        medicineName: medicineName || null,
        insulinUnits: insulinUnits !== undefined && insulinUnits !== '' ? parseFloat(insulinUnits) : null,
        mealNotes: mealNotes || null,
        symptoms: symptoms || null,
        remarks: remarks || null,
      },
    });

    res.status(201).json(reading);
  } catch (error: any) {
    console.error('Create reading error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const existing = await prisma.sugarReading.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    const {
      readingDate,
      readingTime,
      readingType,
      bloodSugar,
      medicineTaken,
      medicineName,
      insulinUnits,
      mealNotes,
      symptoms,
      remarks,
    } = req.body;

    const reading = await prisma.sugarReading.update({
      where: { id },
      data: {
        readingDate,
        readingTime,
        readingType,
        bloodSugar: bloodSugar !== undefined ? parseFloat(bloodSugar) : undefined,
        medicineTaken: medicineTaken !== undefined ? (medicineTaken === true || medicineTaken === 'true') : undefined,
        medicineName: medicineName !== undefined ? (medicineName || null) : undefined,
        insulinUnits: insulinUnits !== undefined && insulinUnits !== '' ? parseFloat(insulinUnits) : null,
        mealNotes: mealNotes !== undefined ? (mealNotes || null) : undefined,
        symptoms: symptoms !== undefined ? (symptoms || null) : undefined,
        remarks: remarks !== undefined ? (remarks || null) : undefined,
      },
    });

    res.json(reading);
  } catch (error: any) {
    console.error('Update reading error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const existing = await prisma.sugarReading.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    await prisma.sugarReading.delete({ where: { id } });
    res.json({ message: 'Reading deleted successfully' });
  } catch (error: any) {
    console.error('Delete reading error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const reading = await prisma.sugarReading.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    res.json(reading);
  } catch (error: any) {
    console.error('Get single reading error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReadings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      search,
      readingType,
      medicineTaken,
      year,
      month,
      sugarRange,
      startDate,
      endDate,
      sortBy = 'readingDate',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const whereClause: any = {
      userId: req.user.id,
    };

    // Text search on notes, symptoms, remarks, medicine name
    if (search) {
      const searchStr = String(search).toLowerCase();
      whereClause.OR = [
        { mealNotes: { contains: searchStr } },
        { symptoms: { contains: searchStr } },
        { remarks: { contains: searchStr } },
        { medicineName: { contains: searchStr } },
      ];
    }

    // Filter readingType
    if (readingType) {
      whereClause.readingType = String(readingType);
    }

    // Filter medicineTaken
    if (medicineTaken !== undefined) {
      whereClause.medicineTaken = medicineTaken === 'true';
    }

    // Filter by year and month
    if (year) {
      const yearStr = String(year);
      if (month) {
        const monthStr = String(month).padStart(2, '0');
        whereClause.readingDate = {
          startsWith: `${yearStr}-${monthStr}`,
        };
      } else {
        whereClause.readingDate = {
          startsWith: `${yearStr}-`,
        };
      }
    }

    // Custom date range
    if (startDate || endDate) {
      whereClause.readingDate = {
        ...(whereClause.readingDate || {}),
        ...(startDate ? { gte: String(startDate) } : {}),
        ...(endDate ? { lte: String(endDate) } : {}),
      };
    }

    // Sugar Range filter
    if (sugarRange) {
      const parts = String(sugarRange).split('-');
      if (parts.length === 2) {
        const minVal = parseFloat(parts[0]);
        const maxVal = parseFloat(parts[1]);
        if (!isNaN(minVal) && !isNaN(maxVal)) {
          whereClause.bloodSugar = {
            gte: minVal,
            lte: maxVal,
          };
        }
      }
    }

    // Sorting parameters
    const orderBy: any = {};
    if (sortBy === 'readingTime') {
      orderBy.readingDate = sortOrder as 'asc' | 'desc';
      orderBy.readingTime = sortOrder as 'asc' | 'desc';
    } else {
      orderBy[String(sortBy)] = sortOrder as 'asc' | 'desc';
    }

    // Handle pagination
    const pageNum = parseInt(String(page)) || 1;
    const limitNum = limit === 'all' ? 0 : (parseInt(String(limit)) || 20);

    const totalCount = await prisma.sugarReading.count({ where: whereClause });

    const fetchConfig: any = {
      where: whereClause,
      orderBy,
    };

    if (limitNum > 0) {
      fetchConfig.skip = (pageNum - 1) * limitNum;
      fetchConfig.take = limitNum;
    }

    const readings = await prisma.sugarReading.findMany(fetchConfig);

    res.json({
      readings,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum > 0 ? limitNum : totalCount,
        pages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
      },
    });
  } catch (error: any) {
    console.error('Get readings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
