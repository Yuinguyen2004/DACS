import { Injectable } from "@nestjs/common";

@Injectable()
export class PackageService {
    async create(data: any) {
        // Logic to create a package
        return { message: "Package created", data };
    }

    async findAll() {
        // Logic to find all packages
        return [{ id: 1, name: "Sample Package" }];
    }
}