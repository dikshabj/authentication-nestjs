import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Route par kaunse roles allowed hain?
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Agar koi role nahi chahiye (Public route), toh jaane do
    if (!requiredRoles) {
      return true;
    }

    // 2. User ki request se user details nikalo
    const request = context.switchToHttp().getRequest();
    const user = request.user; 
    
    console.log('Required Roles:', requiredRoles);
    console.log('User from Request:', user);
    console.log('User Role:', user?.role);
    // NOTE: Yahan 'user' tabhi milega agar AtGuard pehle chala ho.
    // Isliye RolesGuard ko hamesha AtGuard ke baad lagana.

    // 3. Check karo user ke paas role hai ya nahi
    // (Abhi ke liye maan lete hain user object mein role frontend se ya DB se aa raha hai)
    // Real app mein hum DB call karke role verify karte hain, par abhi ke liye:
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}