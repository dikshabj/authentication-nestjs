import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/common/guards/at.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CustomerService } from './customer.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/schemas/user.schema';
import { CreateCustomerDto } from 'src/auth/dto/create-customer.dto';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { UpdateCustomerDto } from 'src/auth/dto/update-customer.dto';

@UseGuards(AtGuard, RolesGuard)
//poore controller pe hi guard bitha die

@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService:CustomerService){}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.USER)
    create(@Body() dto: CreateCustomerDto, @GetCurrentUserId() userId: string){
       return this.customerService.create(dto , userId);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll(){
        return this.customerService.findAll();
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string){
        await this.customerService.remove(id);
        return { message : "User Deleted Successfully!!"}
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.USER)
    update(@Param('id') id:string , @Body() dto:UpdateCustomerDto){
        return this.customerService.update(id, dto);
    }
}
