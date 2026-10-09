import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMasterDataDto } from './create-master-data.dto.js';
import { MasterData } from './master-data.entity.js';
import { UpdateMasterDataDto } from './update-master-data.dto.js';

export interface MasterDataResponse {
  id: number;
  type: string;
  text: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(MasterData)
    private readonly masterDataRepo: Repository<MasterData>,
  ) {}

  async findAll(type?: string): Promise<MasterDataResponse[]> {
    const rows = await this.masterDataRepo.find({
      where: type === undefined ? undefined : { type },
      order: { type: 'ASC', id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findActive(type?: string): Promise<MasterDataResponse[]> {
    const rows = await this.masterDataRepo.find({
      where: type === undefined ? { isActive: true } : { type, isActive: true },
      order: { type: 'ASC', id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async create(dto: CreateMasterDataDto): Promise<MasterDataResponse> {
    const duplicate = await this.findDuplicate(dto.type, dto.text);
    if (duplicate) {
      throw new ConflictException('A row with this type and text already exists');
    }

    const saved = await this.masterDataRepo.save(
      this.masterDataRepo.create({
        type: dto.type,
        text: dto.text,
        isActive: true,
      }),
    );
    return this.toResponse(saved);
  }

  async update(id: number, dto: UpdateMasterDataDto): Promise<MasterDataResponse> {
    const row = await this.masterDataRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Master data row with id ${id} not found`);
    }

    const duplicate = await this.findDuplicate(row.type, dto.text, id);
    if (duplicate) {
      throw new ConflictException('A row with this type and text already exists');
    }

    row.text = dto.text;
    const saved = await this.masterDataRepo.save(row);
    return this.toResponse(saved);
  }

  private findDuplicate(type: string, text: string, excludeId?: number): Promise<MasterData | null> {
    const query = this.masterDataRepo
      .createQueryBuilder('masterData')
      .where('LOWER(masterData.type) = LOWER(:type)', { type })
      .andWhere('LOWER(masterData.text) = LOWER(:text)', { text });
    if (excludeId !== undefined) {
      query.andWhere('masterData.id != :excludeId', { excludeId });
    }
    return query.getOne();
  }

  private toResponse(row: MasterData): MasterDataResponse {
    return {
      id: row.id,
      type: row.type,
      text: row.text,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }
}