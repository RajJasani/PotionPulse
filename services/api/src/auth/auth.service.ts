import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { Membership, MembershipDocument } from '../tenants/schemas/membership.schema';
import { Location, LocationDocument } from '../inventory/schemas/location.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, GoogleAuthDto } from './dto/login.dto';
import { UserRole } from '@potionpulse/contracts';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6)
    );
  }

  private signTokens(userId: string, email: string, isSuperAdmin: boolean) {
    const payload = { sub: userId, email, isSuperAdmin };
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'potionpulse-dev-secret-replace-in-production-64-chars-minimum-key';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'potionpulse-dev-refresh-secret-replace-in-production-64-chars-key';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      isSuperAdmin: false,
      status: 'active',
    });

    const shopName = dto.shopName || `${dto.displayName}'s Potion Pantry`;
    const tenant = await this.tenantModel.create({
      name: shopName,
      slug: this.generateSlug(shopName),
      timezone: 'UTC',
      currency: 'USD',
      unitSystem: 'metric',
      settings: {
        allowNegativeStock: false,
        defaultSafetyStockDays: 7,
      },
    });

    // Create OWNER membership
    const membership = await this.membershipModel.create({
      userId: user._id,
      tenantId: tenant._id,
      role: UserRole.OWNER,
      status: 'active',
    });

    // Create default stock shelf location
    await this.locationModel.create({
      tenantId: tenant._id,
      name: 'Main Shelf A',
      code: 'SHELF-A1',
      type: 'shelf',
      isDefault: true,
    });

    const tokens = this.signTokens(user._id.toString(), user.email, user.isSuperAdmin);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        isSuperAdmin: user.isSuperAdmin,
      },
      activeTenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        role: membership.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Resolve user's active tenant
    const memberships = await this.membershipModel
      .find({ userId: user._id, status: 'active' })
      .populate('tenantId');

    if (memberships.length === 0 && !user.isSuperAdmin) {
      throw new UnauthorizedException('User has no active shop memberships');
    }

    const primaryMembership = memberships[0];
    const tenant = primaryMembership ? (primaryMembership.tenantId as any) : null;

    const tokens = this.signTokens(user._id.toString(), user.email, user.isSuperAdmin);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        isSuperAdmin: user.isSuperAdmin,
      },
      activeTenant: tenant && primaryMembership
        ? {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
            role: primaryMembership.role,
          }
        : null,
      memberships: memberships.map((m) => ({
        tenantId: (m.tenantId as any)._id?.toString(),
        tenantName: (m.tenantId as any).name,
        role: m.role,
      })),
      ...tokens,
    };
  }

  async googleAuth(dto: GoogleAuthDto) {
    // In dev / preview exchange or verification
    if (!dto.idToken) {
      throw new BadRequestException('Google ID token is required');
    }

    // Generate stable mock/exchange user from token payload or demo account
    const email = `google_${dto.idToken.substring(0, 8)}@potionpulse.dev`.toLowerCase();
    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        email,
        displayName: 'Google Alchemist',
        authProviderIds: { google: dto.idToken },
        status: 'active',
      });

      const tenant = await this.tenantModel.create({
        name: 'Hexley Garden Shop',
        slug: this.generateSlug('Hexley Garden Shop'),
      });

      await this.membershipModel.create({
        userId: user._id,
        tenantId: tenant._id,
        role: UserRole.OWNER,
        status: 'active',
      });

      await this.locationModel.create({
        tenantId: tenant._id,
        name: 'Main Shelf A',
        code: 'SHELF-A1',
        isDefault: true,
      });
    }

    const membership = await this.membershipModel.findOne({ userId: user._id });
    const tenant = membership ? await this.tenantModel.findById(membership.tenantId) : null;
    const tokens = this.signTokens(user._id.toString(), user.email, user.isSuperAdmin);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      },
      activeTenant: tenant
        ? {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
            role: membership?.role,
          }
        : null,
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'potionpulse-dev-refresh-secret-replace-in-production-64-chars-key';

    try {
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = this.signTokens(user._id.toString(), user.email, user.isSuperAdmin);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships = await this.membershipModel
      .find({ userId: user._id, status: 'active' })
      .populate('tenantId');

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        isSuperAdmin: user.isSuperAdmin,
      },
      memberships: memberships.map((m) => {
        const tenant = m.tenantId as any;
        return {
          id: m._id.toString(),
          tenantId: tenant?._id?.toString(),
          tenantName: tenant?.name,
          tenantSlug: tenant?.slug,
          role: m.role,
          status: m.status,
        };
      }),
    };
  }
}
