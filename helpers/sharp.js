const path = require('path');
const fs = require('fs');
const sharp = require('sharp');


const addProductImages = async (files) => {
    const imagesPath = path.join(__dirname, '../public/productImages');

    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath);
    }

    const saveProductImages = files.map(async (file) => {
        const lPath = path.join(imagesPath, `${Date.now()}-${file.originalname}`);
        const dbPath = `/productImages/${path.basename(lPath)}`;

        await sharp(file.buffer)
            .resize(1000, 1000)
            .jpeg({ quality: 90 })
            .toFile(lPath);

        return dbPath;
    });

    return await Promise.all(saveProductImages);
};

const editproductImages = async(files) =>{
    const imagesDir = path.join(__dirname, '../public/productImages');
    let newImages = [];
         

    const saveProductImages = files.map(async (file) => {
        const localPath = path.join(imagesDir, `${Date.now()}-${file.originalname}`);
            await sharp(file.buffer)
            .resize(1000, 1000)
            .jpeg({ quality: 90 })
            .toFile(localPath);
        const databasePath = `/productImages/${path.basename(localPath)}`;
        newImages.push(databasePath);
    });

     await Promise.all(saveProductImages);
     return newImages
}



const addCategoryImage = async(files)=>{


    const imagesDir = path.join(__dirname, '../public/CategoryImages');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    const file = files[0];
    const localFilePath = path.join(imagesDir, `${Date.now()}-${file.originalname}`);
        await sharp(file.buffer)
        .resize(1000, 1000)
        .jpeg({ quality: 90 })
        .toFile(localFilePath);

    const databasePath = `/CategoryImages/${path.basename(localFilePath)}`;

    return databasePath


}

const editCategoryImage = async(file)=>{
    const imagesDir = path.join(__dirname, '../public/CategoryImages');
    const localFilePath = path.join(imagesDir, `${Date.now()}-${file.originalname}`);

        await sharp(file.buffer)
        .resize(1000, 1000)
        .jpeg({ quality: 90 })
        .toFile(localFilePath);

    const databasePath = `/CategoryImages/${path.basename(localFilePath)}`;
    return databasePath;
    
}

module.exports={
    addProductImages,
    editproductImages,
    addCategoryImage,
    editCategoryImage
}