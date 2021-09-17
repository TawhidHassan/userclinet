const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
// const AppError = require('./../utils/appError');

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION
});
exports.uploadS3 = multer({
  storage: multerS3({
    s3,
    bucket: 'salesxbucket',
    acl: 'public-read',
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

const storage = multer.diskStorage({
  //multers disk storage settings
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    const datetimestamp = Date.now();
    cb(
      null,
      `${file.fieldname}-${datetimestamp}.${
        file.originalname.split('.')[file.originalname.split('.').length - 1]
      }`
    );
  }
});

exports.upload = multer({
  //multer settings
  storage: storage,
  fileFilter: function(req, file, callback) {
    //file filter
    if (
      ['xls', 'xlsx'].indexOf(
        file.originalname.split('.')[file.originalname.split('.').length - 1]
      ) === -1
    ) {
      return callback(new Error('Wrong extension type'));
    }
    callback(null, true);
  }
}).single('file');
