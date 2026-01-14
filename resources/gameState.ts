import {tables, type User} from 'harperdb';

export class GameState extends tables.GameState {
	allowRead(user: User, target) {
		return true;
	}

	allowCreate(user: User, newData, target) {
		return true;
	}

	allowUpdate(user: User, updatedData, target) {
		return true;
	}

	allowDelete(user: User, target) {
		return true;
	}
}
