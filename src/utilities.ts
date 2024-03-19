import Joi from 'joi';  

export const validateEvent = (messageBody: any) => {
    // Define the ticketsCategories schema
    const ticketsCategoriesJoiSchema = Joi.object({
        type: Joi.string().required(),
        price: Joi.number().required(),
        initial_quantity: Joi.number().required(),
        available_quantity: Joi.number().required(),
    });

    // Define the event schema
    const eventJoiSchema = Joi.object({
        name: Joi.string().required(),
        category: Joi.string().valid('Charity Event', 'Concert', 'Conference', 'Convention', 'Exhibition', 'Festival', 'Product Launch', 'Sport Event').required(),
        organizer: Joi.string().required(),
        start_date: Joi.string().isoDate().required(),
        end_date: Joi.string().isoDate().required(),
        description: Joi.string().required(),
        tickets: Joi.array().items(ticketsCategoriesJoiSchema).min(1).required(),
        total_available_tickets: Joi.number().required(),
        image_url: Joi.string().uri().optional(), //add difault image url if not provided
    });

    // Validate the message body
    return eventJoiSchema.validate(messageBody);
}

export function validateEventDates ( event: any ): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!dateRegex.test(event.start_date) || !dateRegex.test(event.end_date))
    {
       return false;
    }
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    return start < end;
}

export function validateEventUpdatedDates ( event: any, new_end_date:string ): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!dateRegex.test(new_end_date))
    {
       return false;
    }
    const currentEndDate = new Date(event.end_date);
    const newEndDate = new Date(new_end_date);
    return currentEndDate < newEndDate;
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