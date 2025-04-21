const httpStatus = require("http-status");


const pageHead = async (page_name_slug) => {
    try {    
        return page_name_slug;
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
}

module.exports = {
    pageHead
}