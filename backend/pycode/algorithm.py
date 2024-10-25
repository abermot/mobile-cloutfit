from scipy.spatial.distance  import cosine
from sklearn.cluster import DBSCAN
import numpy as np
import json
import sys
import ast

def clustering(like_embeddings, dislike_embedding):
    # embeddings sin etiquetar
    untag_embeddings = np.concatenate((like_embeddings, dislike_embedding))

    # embeddings etiquetados (1 -> likes 0 -> dislikes)
    likes_labels = [1] * len(like_embeddings)
    dislike_labels = [0] * len(dislike_embedding)
    tag_embeddings = np.concatenate((likes_labels, dislike_labels))

    # algoritmo de clustering
    dbscan = DBSCAN(eps=8, min_samples=2)
    clusters = dbscan.fit_predict(untag_embeddings)

    # contar clusters y puntos de ruido
    labels = dbscan.labels_
    n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise_ = list(labels).count(-1)

    sys.stderr.write("Estimated number of clusters: %d\n" % n_clusters_)
    sys.stderr.write("Estimated number of noise points: %d\n" % n_noise_)

    # guarda los embeddings en sus respectivos clusters
    # clusters y embeddings estan en orden
    clusters_dict = {}
    for i, cluster in enumerate(clusters) :
        if cluster == -1:
            continue # salta el cluster de ruido
        if cluster not in clusters_dict:
            clusters_dict[cluster] = {'like': [], 'dislike': []}
        if tag_embeddings[i] == 1:
            clusters_dict[cluster]['like'].append(untag_embeddings[i])
        else:
            clusters_dict[cluster]['dislike'].append(untag_embeddings[i])

    # calcula los centroides de las prendas etiquetadas como "like" y "dislike" para cada cluster.
    centroids = {}
    for cluster_label, embeddings in clusters_dict.items():
        centroids[cluster_label] = { # calcula el promedio de todos los embeddings de las imágenes que han sido etiquetadas como "like" y "dislike" dentro de ese cluster.
            'like': np.mean(embeddings['like'], axis=0) if embeddings['like'] else None,
            'dislike': np.mean(embeddings['dislike'], axis=0) if embeddings['dislike'] else None
        }
    return centroids



def recommendation(rest_images, centroids):
    distances = []
    sys.stderr.write("Calculating distances...\n") 

    embeddings_values = [ast.literal_eval(embeddings) for i, embeddings in rest_images.items()]
  
    for i, key in enumerate(rest_images.keys()):
        rest_images[key] = embeddings_values[i]

    # calculamos la distancia desde cada embedding en rest a todos los centroides
    for image_id, test_embedding in rest_images.items():
        values = []

        test_embedding = np.ravel(test_embedding)

        for _, centroid in centroids.items():
            final_value = []


            if centroid['like'] is not None:
                like_mean = cosine(test_embedding, centroid['like'])
                
            if centroid['dislike'] is not None:
                dislike_mean = cosine(test_embedding, centroid['dislike'])

            final_value = (1 / like_mean) - ( 1 / dislike_mean)
            values.append(final_value)
                
        distances.append({
            'image_id': image_id,
            'value': max(values)
        })
    
    likes_distances_sorted = sorted(distances, key=lambda x: -x['value'])
    likes_top_recommendations = likes_distances_sorted[:50]
    result = {item['image_id']: item['value'] for item in likes_top_recommendations}
    return result


    
def main() : 
    input_data = sys.stdin.read()
    data = json.loads(input_data)

    # Obtenemos las listas a partir de data
    likes = data.get("likes")
    dislikes = data.get("dislikes")
    rest = data.get("rest")

    # pasamos cada embedding de tipo string a array de floats
    likes = [ast.literal_eval(like) for like in likes]
    dislikes = [ast.literal_eval(dislike) for dislike in dislikes]

    # obtenemos los centroides
    centroids = clustering(like_embeddings=likes, dislike_embedding=dislikes)

    # calculamos la recomendacion
    result = recommendation(rest_images=rest, centroids=centroids)
    result_keys = list(result.keys())    

    try:
        data = json.dumps(result_keys)
        print(data)
    except json.JSONDecodeError as e:
        print("Invalid json syntax:", e)


if __name__ == "__main__":
    main()
