const { insertData } = require("../../../services/controllerService")
const bcrypt = require("bcrypt")
const prismaService = require("../../../services/prismaService") 

const POST_COURSE = async (req , res) => {
    try 
    {
        const {name, kode, password, confirmPassword, city, district, horoo, location, location_map, phone, shortdesc  } = req.body;

        if(!name)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Автосургуулийн нэрийг оруулна уу."
            })
        }
        if(!kode)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Нэвтрэх код оруулна уу."
            })
        }
        if(!password)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Нууц үг оруулна уу."
            })
        }
        if(!confirmPassword)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Нууц үг давтан оруулна уу."
            })
        }
        if(!city)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Аймаг / Хот сонгоно уу."
            })
        }
        if(!district)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Дүүрэг сонгоно уу."
            })
        }
        if(!horoo)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Хороо сонгоно уу."
            })
        }
        if(!location)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Тодорхой хаяг оруулна уу."
            })
        }
        if(!location_map)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Байршил сонгоно уу."
            })
        }
        if(!phone)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Холбогдох дугаар оруулна уу."
            })
        }
        if(!shortdesc)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Богино тайлбар оруулна уу."
            })
        }

        const existKode = await prismaService.course.findFirst({
            where: {
                kode:kode
            }
        })

        if(existKode)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Нэвтрэх код бүртгэлтэй байна."
            })
        }

        if(password !== confirmPassword)
        {
            return res.status(400).json({
                success:false,
                data:[],
                message: "Нууц үг хоорондоо таарахгүй байна."
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashed = await bcrypt.hash(password, salt)

        await insertData(res, { model: 'course', data: { name, kode, password:hashed, city:parseInt(city), district: parseInt(district), horoo:parseInt(horoo), location, location_map, phone, shortdesc, date: new Date()}})
    }
    catch(err)
    {

    }
}

module.exports = POST_COURSE