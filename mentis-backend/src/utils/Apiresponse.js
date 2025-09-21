class Apiresponse {
    constructor(statuscode, data = null, message = "success", meta = {}) {
        this.statuscode = statuscode;
        this.message = message;
        this.data = data;
        this.success = statuscode < 400;
        this.meta = meta;
    }
}
export { Apiresponse };