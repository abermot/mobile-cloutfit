import scrapy 
import re
from cloutfit_scraping.items import Product


class ZaraSpider(scrapy.Spider):
    name = "zara"
    allowed_domains = ['zara.com']
    start_urls = ['https://www.zara.com/es/']
    keywords = {'/man', 'hombre', 'mujer', '/woman'}
    exclusions =  {'perfumes', 'hair', 'beauty', 'traje', 'conjuntos', 'preowned', 'special-editions'} # exclude categories of no interest

    def parse(self, response):
        # extract category links (woman's and men's category)
        categories = response.css('.layout-categories-category__link::attr(href)').extract()
        for category in categories:
            if any(keyword in category for keyword in self.keywords) and not any(exclusion in category for exclusion in self.exclusions):
                yield scrapy.Request(url=category, callback=self.parse_category, meta={'page': 1, 'category': category}) # all links start from page 1

    def parse_category(self, response):

        # differentiate between men and women
        gender  = 'woman' if 'mujer' in response.url or 'woman' in response.url else 'men'
        visited_links = set()
        products = response.css('.product-grid-product__figure')
        if products: 
            for product in products:
                link = product.css('.product-link::attr(href)').extract_first()
                if link:
                    visited_links.add(link)
                            
            visited_links -= {link for link in visited_links if '-pT' in link}

            for link in visited_links:
                yield scrapy.Request(url=link, callback=self.parse_product, meta={'page': response.meta['page'], 'gender': gender, 'category': response.meta['category']})
      
            next_page = response.urljoin(f'?page={response.meta["page"] + 1}')
            yield scrapy.Request(url=next_page, callback=self.parse_category, meta={'page': response.meta['page'] + 1, 'category': response.meta['category']})

    def parse_product(self, response):
        all_deliveryUrls = []
        
        # search in javascript
        delivery_urls = response.css('script[data-compress="true"]::text').getall()
        for js_text in delivery_urls:
            deliveryUrls = re.findall(r'"deliveryUrl":"(.*?)"', js_text)
            all_deliveryUrls.extend(deliveryUrls)
        
        images = list(set(all_deliveryUrls))  # remove duplicates by converting the list to a set and then back to a list

        if images:
            zara_product = Product()
            zara_product['category'] = response.meta['category']
            zara_product['gender'] = response.meta['gender']
            zara_product['page_link'] = response.url
            zara_product['images'] = images
            zara_product['name'] = response.css('.product-detail-info__header-name').re_first('>(.*?)<')
            zara_product['price'] = response.css('.money-amount__main').re_first('>(.*?)<')
            zara_product['description'] = response.css('.expandable-text__inner-content p::text').get()
            zara_product['colour'] = response.css('.product-detail-info__actions p::text').get()
            yield zara_product
        else:
            self.logger.info(f'No images found for product URL: {response.url}, skipping...')

