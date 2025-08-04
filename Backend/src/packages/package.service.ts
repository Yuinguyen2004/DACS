import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Package } from './package.schema';
import { Model } from 'mongoose';

@Injectable()
export class PackageService {
  constructor(
    @InjectModel(Package.name) private packageModel: Model<Package>,
  ) {}

  async findAll() {
    return this.packageModel.find();
  }

  async findById(id: string) {
    return this.packageModel.findById(id);
  }

  async getPackageForPayment(id: string) {
    const pkg = await this.packageModel.findById(id);
    if (!pkg) {
      throw new Error('Package not found');
    }
    return {
      id: pkg._id,
      name: pkg.name,
      price: pkg.price,
      duration: pkg.Duration,
      benefit: pkg.Benefit,
    };
  }
}
