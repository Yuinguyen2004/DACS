import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Package } from "./package.schema";
import { Model } from "mongoose";

@Injectable()
export class PackageService {
    constructor(@InjectModel(Package.name) private packageModel: Model<Package>) { }

    async findAll() {
        return this.packageModel.find();
    }
}