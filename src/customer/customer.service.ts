import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CustomerModule } from './customer.module';
import { Model } from 'mongoose';
import { CreateCustomerDto } from 'src/auth/dto/create-customer.dto';
import { UpdateCustomerDto } from 'src/auth/dto/update-customer.dto';

@Injectable()
export class CustomerService {
    constructor(
        @InjectModel(Customer.name) private customerModel : Model<CustomerDocument>,
    ) {}

    //create a new customer
    async create(dto: CreateCustomerDto, userId : string): Promise<Customer>{
        const newCustomer = new this.customerModel({
            ...dto,
            createdBy : userId,
            //link customer to the user who created it
        });
        return await newCustomer.save();
    }

    //sare customers read krne ki list dekhna
    async findAll(): Promise<Customer[]>{
        return await this.customerModel.find().populate('createdBy', 'email role').exec();
    }

    //delete : customer ko delete krna
    async remove(id: string):Promise<void>
{
    const result = await this.customerModel.findByIdAndDelete(id);
    if(!result) throw new NotFoundException('Customer not found!')
}

//update
async update(id: string, dto: UpdateCustomerDto): Promise<Customer>{
    const updatedCustomer = await this.customerModel
    .findByIdAndUpdate(id , dto , {new : true})
    .exec();

    //{new: true} likhne se hme new hi data return hoga
    //vrna mongoose kabhi kabhi puraana return kr deta hai

    if(!updatedCustomer){
        throw new NotFoundException('Customer not found!');
    }

    return updatedCustomer;
}
}
