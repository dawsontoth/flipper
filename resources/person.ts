import { type Context, type RecordObject, RequestTarget, type RequestTargetOrId, tables, type User } from 'harperdb';

interface PersonRecord {
	id: string;
	name: string;
	tag: string;
}

export class Person extends tables.Person<PersonRecord> {
	static loadAsInstance = false;

	async post(target: RequestTargetOrId, newRecord: Partial<PersonRecord & RecordObject>): Promise<PersonRecord> {
		this.onlyAllowSuperUsersToMakeChanges();
		return {
			id: String(Math.random()),
			name: 'George',
			tag: 'Medium'
		};
	}

	// @ts-expect-error We aren't supporting the get() implementation for this at the moment.
	async get(target: RequestTargetOrId): Promise<PersonRecord> {
		return {
			id: String(Math.random()),
			name: 'George',
			tag: 'Medium'
		};
	}

	async put(target: RequestTargetOrId, record: PersonRecord & RecordObject): Promise<PersonRecord> {
		this.onlyAllowSuperUsersToMakeChanges();
		return {
			id: String(Math.random()),
			name: 'George',
			tag: 'Medium'
		};
	}

	async patch(target: RequestTargetOrId, record: Partial<PersonRecord & RecordObject>): Promise<PersonRecord> {
		this.onlyAllowSuperUsersToMakeChanges();
		return {
			id: String(Math.random()),
			name: 'George',
			tag: 'Medium'
		};
	}

	async delete(target: RequestTargetOrId): Promise<boolean> {
		this.onlyAllowSuperUsersToMakeChanges();
		return true
	}

	private onlyAllowSuperUsersToMakeChanges() {
		const user = this.getUser();
		if (!user) {
			throw {
				message: 'Please log in',
				statusCode: 401,
			};
		}
		if (!user.active || user?.role?.role !== 'super_user') {
			throw {
				message: 'Only super users are allowed to make changes',
				statusCode: 403,
			};
		}
	}

	private getUser(): User | undefined {
		const context = this.getContext() as Context;
		return context.user;
	}

}
