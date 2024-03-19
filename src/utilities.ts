import Joi from 'joi';  

//checks that date format is OK
export function validateEventDates ( start_date: any, end_date:string ): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date))
    {
       return false;
    }
    const start = new Date(start_date);
    const end = new Date(end_date);
    return start < end;
}

//check that updated date are posponing the event
export function validateDateUpdate(currentEvent: any, start_date: any): boolean {
    if (start_date < currentEvent.start_date)
    {
        return false;
    }
    return true;
}

export function createSuccessfulResponse (res: any, statusCode: number, data: string) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = statusCode;
    if(data) {
        res.end(data);
    }
    else {
        res.end();
    }
    return;
}

export function createErrorResponse (res: any, statusCode: number, errorMessage: string = "") {
    res.statusCode = statusCode;
    if(errorMessage) {
        res.end(errorMessage);
    }
    else {
        res.end();
    }
    return;
}