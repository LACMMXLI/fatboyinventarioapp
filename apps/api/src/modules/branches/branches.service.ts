import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async findAll(isActive?: boolean) {
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.branchRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string) {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async create(data: { name: string; address?: string; phone?: string }) {
    const existing = await this.branchRepository.findOne({
      where: { name: data.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe una sucursal con ese nombre');
    }

    const branch = this.branchRepository.create({
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
    });

    return this.branchRepository.save(branch);
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      isActive?: boolean;
    },
  ) {
    const branch = await this.findById(id);

    if (data.name && data.name.trim() !== branch.name) {
      const existing = await this.branchRepository.findOne({
        where: { name: data.name.trim() },
      });
      if (existing) {
        throw new ConflictException('Ya existe una sucursal con ese nombre');
      }
      branch.name = data.name.trim();
    }

    if (data.address !== undefined) branch.address = data.address?.trim() || null;
    if (data.phone !== undefined) branch.phone = data.phone?.trim() || null;
    if (data.isActive !== undefined) branch.isActive = data.isActive;

    return this.branchRepository.save(branch);
  }
}
