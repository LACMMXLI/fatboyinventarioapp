import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invitation_settings')
export class InvitationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'admin_invitation_code', default: '' })
  adminInvitationCode: string;

  @Column({ type: 'varchar', length: 100, name: 'encargado_invitation_code', default: '' })
  encargadoInvitationCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
