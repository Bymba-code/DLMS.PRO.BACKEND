const express = require("express")
const POST_CREATOR = require("../../controllers/24. Creators/3. POST")
const { upload, uploadChunk } = require("../../services/uploadService")

const router = express.Router()

router.route("/creator")
.post(uploadChunk.single('chunk'), POST_CREATOR)

module.exports = router