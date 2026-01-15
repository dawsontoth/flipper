import { type IterableEventQueue, tables, type User } from 'harperdb';

interface GameStateRecord {
	id: string;
	type?: 'get' | 'put';
	state: {
		heads: boolean;
		tails: boolean;
		headsInARow: boolean;
		maxHeadsStreak: boolean;
		cashCents: boolean;
		headsChance: boolean;
		flipTimeMs: boolean;
		comboMult: boolean;
		baseWorthCents: boolean;
		autoFlipEnabled: boolean;
		upgrades: {
			headsChance: number;
			flipTime: number;
			comboMult: number;
			baseWorth: number;
			autoFlip: number;
		};
	};
}

export class GameState extends tables.GameState<GameStateRecord> {
	static loadAsInstance = false;

	allowRead(user: User, target) {
		return true;
	}

	allowCreate(user: User, newData: GameStateRecord, target) {
		return true;
	}

	allowUpdate(user: User, updatedData: GameStateRecord, target) {
		return true;
	}

	allowDelete(user: User, target) {
		return true;
	}

	connect(target, incomingMessages: IterableEventQueue<GameStateRecord>) {
		target.subscribe = false;
		const outgoingMessages = super.connect(target, incomingMessages) as unknown as Promise<IterableEventQueue>;
		incomingMessages.on('data', async (message: GameStateRecord) => {
			const { type, id, ...rest } = message;
			switch (type) {
				case 'get':
					const loaded = await this.get(id);
					(await outgoingMessages).send({
						type: 'get',
						id,
						...(loaded ? loaded : {}),
					});
					break;
				case 'put':
					await this.put(id as any, rest as any);
					break;
			}
		});
		return outgoingMessages as unknown as IterableEventQueue;
	}
}
