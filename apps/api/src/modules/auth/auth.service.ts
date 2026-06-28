import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { UsersService } from '../users/users.service';
import { InvitationSettings } from './entities/invitation-settings.entity';
import {
  InvitationCodesDto,
  LoginResponse,
  RegisterRequest,
  UpdateInvitationCodesRequest,
  UserProfile,
  UserRole,
} from '@inventarioapp/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(InvitationSettings)
    private readonly invitationSettingsRepository: Repository<InvitationSettings>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      relations: ['branch'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tu cuenta está desactivada. Contacta al administrador.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload);
    const profile = this.toUserProfile(user);

    return { accessToken, user: profile };
  }

  async register(data: RegisterRequest) {
    if (![UserRole.ADMIN, UserRole.ENCARGADO].includes(data.role)) {
      throw new BadRequestException('Solo se permite registrar Administrador o Encargado');
    }

    const codes = await this.getInvitationCodes();
    const expectedCode =
      data.role === UserRole.ADMIN
        ? codes.adminInvitationCode
        : codes.encargadoInvitationCode;

    if (!expectedCode) {
      throw new BadRequestException('El administrador debe configurar el código de invitación');
    }

    if (data.invitationCode.trim() !== expectedCode) {
      throw new BadRequestException('Código de invitación inválido');
    }

    return this.usersService.create({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role,
      branchId: data.branchId,
    });
  }

  async getRegistrationBranches() {
    return this.branchRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getInvitationCodes(): Promise<InvitationCodesDto> {
    const settings = await this.getOrCreateInvitationSettings();
    return {
      adminInvitationCode: settings.adminInvitationCode,
      encargadoInvitationCode: settings.encargadoInvitationCode,
    };
  }

  async updateInvitationCodes(
    data: UpdateInvitationCodesRequest,
  ): Promise<InvitationCodesDto> {
    const adminInvitationCode = data.adminInvitationCode.trim();
    const encargadoInvitationCode = data.encargadoInvitationCode.trim();

    if (adminInvitationCode === encargadoInvitationCode) {
      throw new BadRequestException('Los códigos de invitación deben ser diferentes');
    }

    const settings = await this.getOrCreateInvitationSettings();
    settings.adminInvitationCode = adminInvitationCode;
    settings.encargadoInvitationCode = encargadoInvitationCode;
    await this.invitationSettingsRepository.save(settings);
    return this.getInvitationCodes();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await this.userRepository.save(user);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['branch'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.toUserProfile(user);
  }

  private toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
    };
  }

  private async getOrCreateInvitationSettings() {
    const existing = await this.invitationSettingsRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });

    if (existing) return existing;

    return this.invitationSettingsRepository.save(
      this.invitationSettingsRepository.create(),
    );
  }
}
