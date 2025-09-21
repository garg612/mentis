import multer from "multer";
import fs from "fs";
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        const dir = './public/temp';
        try { if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); } } catch(_) {}
        cb(null,dir)
    },
    filename:function(req,file,cb){
        const uniqueSuffix= Date.now()+'-'+Math.round(Math.random()*1E9)
        cb(null,uniqueSuffix+'-'+uniqueSuffix+'.'+file.mimetype.split('/')[1])
    }
});

export const upload = multer({ storage: storage })
