// URI's
export const RABBITMQ_URL = 'amqps://fdtczxwk:r828qkAP9gjwtQfSmtcDUPddlBqv4JBt@roedeer.rmq.cloudamqp.com/fdtczxwk';
export const MONGODB_URL_LIRON = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@finalproject.szjndb6.mongodb.net/EventsBooking?retryWrites=true&w=majority&appName=FinalProject`;
export const MONGODB_URL_EITAN = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@mycluster.fs213ja.mongodb.net/`
export const EVENT_SERVER_URL = 'https://finalproject-backend-eventserver.onrender.com:3001';
//export const EVENT_SERVER_URL = 'http://localhost:3001';
export const PAYMENT_API_URL = 'https://www.cs-wsp.net/_functions/pay';

//Exchange and Queue names
export const COMMENT_QUEUE = "comment_queue";
export const COMMENT_EXCHANGE = "comment_exchange";
export const EVENT_UPDATE_QUEUE = "event_update_queue";
export const EVENT_UPDATE_EXCHANGE = "event_update_exchange";
export const USER_NEXT_EVENT_QUEUE = "user_nextEvent_queue";
export const USER_NEXT_EVENT_EXCHANGE = "user_nextEvent_exchange";
export const ORDER_QUEUE = "order_queue";
export const ORDER_EXCHANGE = "order_exchange";

//Status codes
export const STATUS_OK = 200;
export const STATUS_CREATED = 201;
export const STATUS_BAD_REQUEST = 400;
export const STATUS_UNAUTHORIZED = 401;
export const STATUS_FORBIDDEN = 403;
export const STATUS_NOT_FOUND = 404;
export const STATUS_INTERNAL_SERVER_ERROR = 500;

//Admin user
export const ADMIN_USER = "admin";

//Skip and limit for pagination
export const DEFAULT_LIMIT = 25;
export const DEFAULT_SKIP = 0;
export const DEFAULT_PAGE = 1;

//Permission levels
export const WORKER_LEVEL = "W";
export const MANAGER_LEVEL = "M";
export const ADMIN_LEVEL = "A";

//Event URLS
export const EVENT_API_BASE_URL = "/api/event/:id";
export const GET_EVENT_BO = "/api/event/backoffice/:id";
export const GET_AVAILABLE_EVENTS = "/api/event";
export const CREATE_NEW_EVENT = "/api/event";
export const UPDATE_EVENT = "/api/event/:id";
export const BUY_TICKET_EVENT = "/api/event/buy/:id";
export const SAVE_TICKET = "/api/event/save/:id";

//User URLS
export const GET_USER = "/api/user/:id";
export const POST_COMMMENT = "/api/user/comment";
export const BUY_TICKET_USER = "/api/user/buy";

//Comment URLS
export const GET_COMMENT_COUNT = "/api/comment/count/:event_id";
export const GET_COMMENT = "/api/comment/:event_id";

//Order URLS
export const GET_ORDER = "/api/order/:user_id";
export const GET_NEXT_EVENT = "/api/order/nextEvent/:user_id";