import { useState, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/utils';
import { Item } from '../../utils/modals/interfaces';


export const useFetchClothes = (gender: string, category: string) => {
  const [data, setData] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchClothes = useCallback(async (resetPage = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      let response;
      console.log(`${BASE_URL}/mobile/list_data/${gender}/${category}/${currentPage}`)
      response = await axios.get(`${BASE_URL}/mobile/list_data/${gender}/${category}/${currentPage}`,  {  withCredentials: true});
    
      setData(prevData => resetPage ? response.data : [...prevData, ...response.data]);
      setPage(prevPage => prevPage + 1);
      
    } catch (error) {
      console.log('Error: ' + error);
    } finally {
      setLoading(false);
    }
  }, [loading, gender, category, page]);

  return { data, fetchClothes, setData, setPage};
};