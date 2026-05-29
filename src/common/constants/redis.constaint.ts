export const REDIS_KEYS = {
    CATEGORY: {
        PREFIX: "cache:product_category:",
        TREE: "cache:product_category:tree",
        PARENT: "cache:product_category:parent",
    },
    PRODUCT: {
        PREFIX: "cache:product:",
        ALL: "cache:product:all:",
        OUTSTANDING: "cache:product:outstanding:",
        SALE: "cache:product:sale:"
        
    }
    ,
    NEWS_CATEGORY: {
        PREFIX: "cache:news_category:",
        ALL: "cache:news_category:all"
    },
    NEWS_DETAL: {
        PREFIX: "cache:new:"
    },
    VIEW_TRACK_KEY: {
        PREFIX: "cache:tracked_view:",
        NEWS: "cache:tracked_view:news:",
        PRODUCT: "cache:tracked_view:product:",
    },
    REVIEW:{
        PREFIX: "cache:review_product:",
    },
    SEARCH: {
        PREFIX: "cache:seach:",
        SUGGEST: "cache:seach:suggest:",
        SUGGEST_CHAT: "cache:seach:suggestchat:"
    },
    PAYMENT: {
        PREFIX: "cache:payment:",
        PAYOS: "cache:payment:payos_url:",
        SEPAY: "cache:payment:sepay_url:",
    },
    AUTH: {
        PREFIX: "cache:auth:",
        TEMP_TOKEN: "cache:auth:temp_token:"
    }

}
export const  REDIS_TTL = {
    NEWS_CATEGORY: 86400,
    PRODUCT_CATEGORY: 86400,//24h
    NEWS_CATEGORY_FIND_BY_ID: 240,
    VIEW_TRACK_KEY: 300,
    PRODUCT_TRACK_KEY: 300,
    NEWS:300,
    PRODUCT: 180,//3phuts,
    PRODUCT_DETAIL: 900,
    REVIEW_PRODUCT: 86400,
    SEARCH: 60,
    SUGGEST_SEACH: 30,
    PAYMENT_ONLINE: 600
}