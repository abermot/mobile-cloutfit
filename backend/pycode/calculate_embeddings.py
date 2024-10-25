from torchvision import models, transforms
from functools import partial # allows you to create a new function from an existing function by fixing some of its arguments
import multiprocessing as mp # allows parallel execution
from io import BytesIO
from PIL import Image
import requests # download images from URLs
import torch
import json
import time
import psycopg2

session = requests.Session()

RESNET_MEANS = [0.485, 0.456, 0.406]
RESNET_STDS = [0.229, 0.224, 0.225]


DB_HOSTNAME = 'localhost'
DB_USERNAME = 'postgres'
DB_PASSWORD = 'opH10x' # your password
DB = 'cloutfit'

connection = psycopg2.connect(host=DB_HOSTNAME, user=DB_USERNAME, password=DB_PASSWORD, dbname=DB)
cursor = connection.cursor()

class Item:
    def __init__(self, id, name: str, price: str, description: str, category: str, gender: str, page_link: str, embedding=None):
        self.id = str(id)
        self.name = name
        self.price = price
        self.description = description
        self.category = category
        self.gender = gender
        self.page_link = page_link
        self.photos = []
        self.embedding = embedding

    def load_photo_list_from_id(self):
        white_back_ids = ["-e1", "_B"]
        cursor.execute("""
            select * 
            from clothing_photos
            where catalog_id = %s
            """, (self.id, ))
        res = cursor.fetchall() 
        for item in res:
            self.photos.append(item[2])

        for image in self.photos:
            if any(identificador in image for identificador in white_back_ids):
                self.image = image
                break



# function that loads the images to process from the json
def obtain_images(file):
    white_back_ids = ["-e1", "_B"]
    results = []
    with open(file, 'r') as file:
        data = json.load(file)

    for item in data:
        images = item['images']
        if images:
            page_link = item['page_link']
            for image in images:
                if any(identificador in image for identificador in white_back_ids):
                    results.append({'page_link': page_link, 'image': image})
                    break

    return results

# download the image from the url, with several attempts in case of failure
def download_image(image_url, retries=3, delay=5):
    for attempt in range(retries):
        try:
            response = session.get(image_url)
            if response.status_code == 200 and 'image' in response.headers['Content-Type']:
                return BytesIO(response.content) # contains the downloaded image
            else:
                print(f"Error al descargar {image_url}. Código de estado: {response.status_code}")
        except Exception as e:
            print(f"Error al descargar {image_url} (intento {attempt + 1}/{retries}): {e}")
        time.sleep(delay)
        #delay *= 2 # dplicates the delay in the next attempt -> for now I think it is not necessary
    print(f"Falló al descargar {image_url} después de {retries} intentos")
    return None


def process_loop():
     # define image transformations
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=RESNET_MEANS, std=RESNET_STDS),
    ])

    # get model
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    model = torch.nn.Sequential(*list(model.children())[:-1])
    model.eval()

    cursor.execute("""
        select * 
        from catalog
        where embeddings is null
        """)
    items = cursor.fetchall()
    # item_obj = Item(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], [])
    # item_obj.load_photo_list_from_id
    
    for item in items:
        try:
            item = Item(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7])
           # print("item: ", item)
           # print("item photos: ", item.page_link)
           # print("item photos: ", item.photos)
            item.load_photo_list_from_id()
           # print("item photos: ", item.photos)
            embedding = process_image(item, transform=transform, model=model)
            embedding_str = json.dumps(embedding)

            # save embedding in the DB
            cursor.execute("""
                update catalog set embeddings = %s
                where id = %s
            """, (embedding_str, item.id))
            connection.commit()

        except Exception as e:
            # delete the item from DB
            cursor.execute("""
                delete from clothing_photos
                where catalog_id = %s
            """, (item.id,))
            cursor.execute("""
                delete from catalog
                where id = %s
            """, (item.id,))

            print("some error: ", e)
            connection.commit()
            continue
    
    print("items.len: ", len(items))


# get the embedding of the image
def process_image(item: Item, transform, model):
    image_url = item.image
    if image_url == None:
        raise Exception("Couldn't assign an image to the garment")
    image_data = download_image(image_url)
    if image_data:
        try:
            image = Image.open(image_data).convert('RGB')
            image = transform(image).unsqueeze(0)  # apply transformations and add batch dimension
            with torch.no_grad():
                embedding = model(image).squeeze().numpy()
            return embedding.tolist()
        except Exception as e:
            print(f"Error al procesar la imagen {image_url}: {e}")
    return None, None


def main():
    process_loop()


if __name__ == "__main__":
    main()
