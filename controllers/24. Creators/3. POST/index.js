const { insertData } = require("../../../services/controllerService")
const prismaService = require("../../../services/prismaService")
const fs = require('fs');
const path = require('path');

const POST_CREATOR = async (req, res) => {
    try {
        // Check if this is a chunk upload request
        const isChunkUpload = req.body.chunkIndex !== undefined;

        // ============================================
        // HANDLE CHUNK UPLOAD
        // ============================================
        if (isChunkUpload) {
            const { chunkIndex, totalChunks, fileName, fileId } = req.body;
            const chunk = req.file;

            if (!chunk) {
                return res.status(400).json({
                    success: false,
                    message: 'Chunk file байхгүй байна.'
                });
            }

            // Create temp directory for chunks
            const tempDir = path.join(__dirname, '../../../uploads/temp', fileId);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Save chunk with index
            const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
            fs.renameSync(chunk.path, chunkPath);

            // Check if all chunks are uploaded
            const uploadedChunks = fs.readdirSync(tempDir).length;
            
            if (uploadedChunks === parseInt(totalChunks)) {
                // All chunks uploaded, merge them
                const finalFileName = `${Date.now()}-${fileName}`;
                const finalPath = path.join(__dirname, '../../../uploads', finalFileName);
                const writeStream = fs.createWriteStream(finalPath);

                // Merge chunks in order
                for (let i = 0; i < parseInt(totalChunks); i++) {
                    const chunkFilePath = path.join(tempDir, `chunk-${i}`);
                    const chunkBuffer = fs.readFileSync(chunkFilePath);
                    writeStream.write(chunkBuffer);
                    fs.unlinkSync(chunkFilePath); // Delete chunk after merging
                }

                writeStream.end();

                // Wait for write to finish
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                // Remove temp directory
                fs.rmdirSync(tempDir);

                return res.status(200).json({
                    success: true,
                    message: 'Файл амжилттай upload боллоо.',
                    data: {
                        fileName: finalFileName,
                        isComplete: true
                    }
                });
            }

            // Not all chunks uploaded yet
            return res.status(200).json({
                success: true,
                message: `Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} upload боллоо.`,
                data: {
                    uploadedChunks,
                    totalChunks: parseInt(totalChunks),
                    isComplete: false
                }
            });
        }

        // ============================================
        // HANDLE REGISTRATION (Not chunk upload)
        // ============================================
        const {
            fullName,
            nickname,
            dateOfBirth,
            gender,
            location,
            phoneNumber,
            email,
            discordUsername,
            socialMediaLink,
            editingApps,
            editingDevice,
            experienceLevel,
            videoFileName
        } = req.body;

        // Parse editingApps if it's a JSON string
        let parsedEditingApps = editingApps;
        if (typeof editingApps === 'string') {
            try {
                parsedEditingApps = JSON.parse(editingApps);
            } catch (e) {
                parsedEditingApps = [editingApps];
            }
        }

        // Convert gender to integer (0 = Male, 1 = Female, 2 = Prefer not to say)
        let genderInt = null;
        if (gender === 'Male') genderInt = 0;
        else if (gender === 'Female') genderInt = 1;
        else if (gender === 'Prefer not to say') genderInt = 2;

        // Convert experience to integer (0 = Beginner, 1 = Intermediate, 2 = Pro)
        let experienceInt = null;
        if (experienceLevel === 'Beginner') experienceInt = 0;
        else if (experienceLevel === 'Intermediate') experienceInt = 1;
        else if (experienceLevel === 'Pro') experienceInt = 2;

        // Required field validations
        if (!fullName) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Бүтэн нэр оруулна уу."
            })
        }

        if (!dateOfBirth) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Төрсөн огноо оруулна уу."
            })
        }

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Утасны дугаар оруулна уу."
            })
        }

        // Phone number validation (8 digits)
        if (!/^\d{8}$/.test(phoneNumber.trim())) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Утасны дугаар 8 оронтой байх ёстой."
            })
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "И-мэйл хаяг оруулна уу."
            })
        }

        // Email format validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "И-мэйл хаягийн формат буруу байна."
            })
        }

        if (!discordUsername) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Discord хэрэглэгчийн нэр оруулна уу."
            })
        }

        if (!socialMediaLink) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Сошиал медиа холбоос оруулна уу."
            })
        }

        // URL validation
        if (!/^https?:\/\/.+/.test(socialMediaLink.trim())) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Сошиал медиа холбоос буруу байна (http:// эсвэл https:// -ээр эхлэх ёстой)."
            })
        }

        if (!editingApps || (Array.isArray(parsedEditingApps) && parsedEditingApps.length === 0)) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Засварлах программ сонгоно уу."
            })
        }

        if (!editingDevice) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Засварлах төхөөрөмж сонгоно уу."
            })
        }

        if (!experienceLevel) {
            return res.status(400).json({
                success: false,
                data: [],
                message: "Туршлагын түвшин сонгоно уу."
            })
        }
        // Convert editingApps array to integer
        const appMapping = {
            'CapCut': 0,
            'Premiere Pro': 1,
            'After Effects': 2,
            'VN': 3,
            'Alight Motion': 4,
            'Other': 5
        };
        
        // Get first selected app and convert to integer
        const mainAppInt = Array.isArray(parsedEditingApps) && parsedEditingApps.length > 0 
            ? (appMapping[parsedEditingApps[0]] !== undefined ? appMapping[parsedEditingApps[0]] : 0) 
            : 0;

        // Insert data into database
        await insertData(res, {
            model: 'creators',
            data: {
                fullname: fullName,
                nickname: nickname || null,
                birthdate: new Date(dateOfBirth),
                gender: genderInt,
                location: location || null,
                phone: phoneNumber,
                email: email,
                discordName: discordUsername,
                social: socialMediaLink,
                mainApp: mainAppInt,
                device: parseInt(editingDevice) || 0,
                experience: experienceInt || 0,
                video: videoFileName || null,
                status: 0,
                date: new Date()
            }
        })

    } catch (err) {
        console.error('Error in POST_CREATOR:', err);
        return res.status(500).json({
            success: false,
            data: [],
            message: "Серверийн алдаа гарлаа. Дахин оролдоно уу."
        })
    }
}

module.exports = POST_CREATOR