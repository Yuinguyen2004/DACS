import { Module } from "@nestjs/common";
import { PackageSchema,Package } from "./package.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { PackageService } from "./package.service";
import { PackageController } from "./package.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Package.name, schema: PackageSchema },
    ]),
  ],
  controllers: [PackageController],
  providers: [PackageService],
  exports: [PackageService]
})
export class PackageModule {}