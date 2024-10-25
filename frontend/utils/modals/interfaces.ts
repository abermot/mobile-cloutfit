  export interface Item {
    id: number;
    name: string;
    price: string;
    description: string;
    category: string;
    colour: string;
    gender: string;
    page_link: string;
    embeddings: string;
    photos_urls: string[];
  }  
  export interface  Recommendations {
    id: number;
    creation_date: string;
    user_id: string;
    r_type: string,
    clothing_id: number,
  }
  