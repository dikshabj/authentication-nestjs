import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Mongoose } from 'mongoose';
import { CustomerSchema } from './schemas/customer.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

@Module({
  imports: 
  [
    MongooseModule.forFeature([{ name: 'Customer', schema: CustomerSchema}]),

  ],
  providers: [CustomerService],
  controllers: [CustomerController]
})
export class CustomerModule {}
