import scrapy
import re
from scrapy import Selector
from selenium import webdriver
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from cloutfit_scraping.items import Product
import time


class MangoSpider(scrapy.Spider):
    name = "mango"
    allowed_domains = ['mango.com']
    start_urls = ['https://shop.mango.com/es/es']
    keywords = {'hombre', 'mujer'}

    keywords = {'hombre/', 'mujer/'}
    exclusions = {'ver-todo', 'man_', 'sostenibilidad', 'bisuteria','cinturon', 'gafas-de-sol', 'fulares', 'panuelos',
                  'fragancia', 'afiliados', 'apps', 'carteras', 'perfumes', 'sombreros', 'gorras', 'mas-accesorios', 'bufandas', 'tallas-plus',
                  'guia', 'minimalist', 'best-sellers', 'prendas', 'premama'}

 
    def __init__(self):
        firefox_options = FirefoxOptions()
        firefox_options.add_argument("--headless")  # Para navegación sin interfaz gráfica
        self.driver = webdriver.Firefox(options=firefox_options)
    
    def parse(self, response):
        # extract category links (woman's and men's category)
        scripts = response.xpath('//script/text()').getall()
        all_categories = set()

        for script in scripts:
            # buscar url
            url_matches = re.findall(r'\\"legacyUrl\\":\\"(.*?)\\"', script)
            for url_match in url_matches:
                if any(keyword in url_match for keyword in self.keywords) and not any(exclusion in url_match for exclusion in self.exclusions):
                    category = 'https://shop.mango.com' + url_match
                    if category not in all_categories:
                        all_categories.add(category)  
                        yield scrapy.Request(url=category, callback=self.parse_category, meta={'category': category}) 

    def parse_category(self, response):
        gender  = 'woman' if 'mujer' in response.url else 'men'
        self.driver.get(response.url)
        scroll_pause_time = 1  # Pause between each scroll
        screen_height = self.driver.execute_script("return window.screen.height;")  # Browser window height
        i = 1
        while True:
            # Scroll down
            self.driver.execute_script(f"window.scrollTo(0, {screen_height * i});")
            i += 1
            time.sleep(scroll_pause_time)

            # Check if reaching the end of the page
            scroll_height = self.driver.execute_script("return document.body.scrollHeight;")
            if screen_height * i > scroll_height:
                break
   
        sel = Selector(text=self.driver.page_source)
        for item in sel.css('div.vsv-ficha, .vsv-product, .ProductImage_productImage__cS5d9'):
            link = item.css('a::attr(href)').get()
            yield scrapy.Request(url=link, callback=self.parse_product, meta={'gender': gender, 'category': response.meta['category']})


    def parse_product(self, response):
        all_images = []

        # search in javascript
        for img in response.css('img.ImageGrid_image__rNegV'):
            imagesSet = img.css('::attr(src)').get()
            all_images.append(imagesSet)

        images = list(set(all_images))

        if images:
            mango_product = Product()
            mango_product['category'] = response.meta['category']
            mango_product['gender'] = response.meta['gender']
            mango_product['page_link'] = response.url
            mango_product['images'] = images
            mango_product['name'] = response.css('.ProductDetail_title___WrC_::text').get()
            mango_product['price'] = response.css('.SinglePrice_end__Hz2J7::text').get()
            mango_product['description'] = response.css('.Description_description__IDgi6 p::text').get()
            mango_product['colour'] = response.css('.ColorsSelector_label__52wJk::text').get()
            yield mango_product
        else:
            self.logger.info(f'No images found for product URL: {response.url}, skipping...')
        
    

    def closed(self):
        self.driver.quit()

