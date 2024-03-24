import Joi from 'joi';
import { User, IUser } from './models/user-model.js';
import * as constants from './const.js';

//checks that date format is OK
export function validateEventDates(start_date: any, end_date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        return false;
    }
    const start = new Date(start_date);
    const end = new Date(end_date);
    return start < end;
}

//check that updated date are posponing the event
export function validateDateUpdate(currentEvent: any, start_date: any): boolean {
    if (start_date < currentEvent.start_date) {
        return false;
    }
    return true;
}

export async function isAutherizedClient(username: string, permissionLevel: string) {

    //if worker level, no need to check the permission
    if (permissionLevel === constants.MANAGER_LEVEL || permissionLevel === constants.ADMIN_LEVEL) {
        // get user permission from DB
        try {
            const user: IUser | null = await User.findOne({ username: username }).exec();
            if (!user) {
                return false;
            } else if (user.permission === constants.ADMIN_LEVEL) {
                return true;
            }
            else if (user.permission === constants.MANAGER_LEVEL && permissionLevel === constants.MANAGER_LEVEL) {
                return true;
            }
            else {
                return false;
            }
        } catch (error) {
            // handle error
            console.error('Error fetching user:', error);
            return false;
        }
    }
    return true;
}

export function setLimit(limit: any): number {
    let ret = constants.DEFAULT_LIMIT;

    if (typeof limit === 'string') {
        const parsedLimit = parseInt(limit, 10);
        ret = parsedLimit >= 0 ? parsedLimit : ret;
    }
    return ret;
}

export function setSkip(skip: any): number {
    let ret = constants.DEFAULT_SKIP;

    if (typeof skip === 'string') {
        const parsedSkip = parseInt(skip, 10);
        ret = parsedSkip >= 0 ? parsedSkip : ret;
    }
    return ret;
}
