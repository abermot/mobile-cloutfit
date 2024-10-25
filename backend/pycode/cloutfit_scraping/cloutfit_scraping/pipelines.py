# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
from cloutfit_scraping.items import Product

import psycopg2


class CloutfitScrapingPipeline:
    def __init__(self):
        hostname = 'localhost'
        username = 'postgres'
        password = 'opH10x' # your password
        database = 'cloutfit'

        ## Create/Connect to database
        self.connection = psycopg2.connect(host=hostname, user=username, password=password, dbname=database)

        ## Create cursor, used to execute commands
        self.cur = self.connection.cursor()
 
        ''' Create tables if not exist...
        self.cur.execute("""
        CREATE TABLE IF NOT EXISTS quotes(
            id serial PRIMARY KEY, 
            content text,
            tags text,
            author VARCHAR(255)
        )
        """)
        '''

        '''
        self.cur.execute("""
        SELECT * from user_info
        """)
        record = self.cur.fetchall()

        print("\n\n ====================== this is what we've got from DB: \n\n\n\n", record)
        '''
    def open_spider(self, spider):
        pass
   #     self.file = open("data.json", "w")

    def close_spider(self, spider):
        # self.file.close()
        self.connection.close()
	
    def process_item(self, item: Product, spider):
        # line = json.dumps(dict(item)) + "\n"
        # self.file.write(line)
        self.cur.execute(""" insert into catalog 
            (id, name, price, description, category, gender, colour, page_link, embeddings)
        values (default, %s, %s, %s, %s, %s, %s, %s, null)
        returning id
        """, (
            str(item["name"]),
            str(item["price"]),
            str(item["description"]),
            str(item["category"]),
            str(item["gender"]),
            str(item["colour"]),
            str(item["page_link"])
        ))
        # get the first value (id) from return statement of database
        id = self.cur.fetchone()[0]
        # print("\n\n\nwe get id: ", id)
        # print("images: ", item['images'])
        # print('\n\n')
        for img in item['images']:
            self.cur.execute(""" insert into clothing_photos 
                (id, catalog_id, url)
                values (default, %s, %s)""", (
                str(id),
                str(img)
            ))
        ## Execute insert of data into database
        self.connection.commit() 
        

        spider.logger.info(f"Written item: {item}")
        return item

'''
item = {
    "name": "ropita",
    "price": "32.03",
    "description": "cousas",
    "category": "ropita",
    "gender": "ropita",
    "page_link": "ropita",
    "images": ["url1", "url2", "url_photo3"]    
}

clout = CloutfitScrapingPipeline()

clout.process_item(item, None)
'''