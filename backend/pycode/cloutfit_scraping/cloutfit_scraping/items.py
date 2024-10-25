import scrapy

class Product(scrapy.Item):
    category = scrapy.Field()
    gender = scrapy.Field()
    page_link = scrapy.Field()
    name = scrapy.Field()
    price = scrapy.Field()
    description = scrapy.Field()
    colour = scrapy.Field()
    images = scrapy.Field(serializer=list)
