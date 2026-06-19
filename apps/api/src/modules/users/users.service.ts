import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '@inventarioapp/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(filters?: {
    role?: UserRole;
    branchId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.branch', 'branch');

    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters?.branchId) {
      query.andWhere('user.branchId = :branchId', {
        branchId: filters.branchId,
      });
    }
    if (filters?.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy('user.fullName', 'ASC');

    const [users, total] = await query.getManyAndCount();

    return {
      data: users.map((u) => this.toDto(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['branch'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toDto(user);
  }

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    branchId?: string;
  }) {
    // Validate: ENCARGADO must have a branch
    if (data.role === UserRole.ENCARGADO && !data.branchId) {
      throw new BadRequestException(
        'Un usuario con rol ENCARGADO debe tener una sucursal asignada',
      );
    }

    // Check unique email
    const existing = await this.userRepository.findOne({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = this.userRepository.create({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName.trim(),
      role: data.role,
      branchId: data.branchId || null,
    });

    const saved = await this.userRepository.save(user);
    return this.findById(saved.id);
  }

  async update(
    id: string,
    data: {
      fullName?: string;
      role?: UserRole;
      branchId?: string | null;
      isActive?: boolean;
    },
  ) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Validate: if changing to ENCARGADO, must have branch
    const newRole = data.role || user.role;
    const newBranchId =
      data.branchId !== undefined ? data.branchId : user.branchId;
    if (newRole === UserRole.ENCARGADO && !newBranchId) {
      throw new BadRequestException(
        'Un usuario con rol ENCARGADO debe tener una sucursal asignada',
      );
    }

    if (data.fullName !== undefined) user.fullName = data.fullName.trim();
    if (data.role !== undefined) user.role = data.role;
    if (data.branchId !== undefined) user.branchId = data.branchId;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await this.userRepository.save(user);
    return this.findById(id);
  }

  private toDto(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
