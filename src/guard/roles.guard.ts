import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		return this.validateRequest(context);
	}

	validateRequest(context: ExecutionContext) {
		const roles = this.reflector.get<string[]>("roles", context.getHandler());

		if (!roles) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;
		const hasRole = () =>
			user.roles.some((role: string) => roles.includes(role));

		return user && user.roles && hasRole();
	}
}
