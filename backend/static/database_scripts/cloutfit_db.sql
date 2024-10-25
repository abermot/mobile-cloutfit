CREATE TABLE user_info (
	id serial primary key,
	username text,
	email text,
	password text,
	code smallint,
	creation_date timestamp,
	is_verified bool
	
);

create table catalog (
	id serial primary key,
	name text,
	price text,
	description text,
	category text,
	gender text,
	page_link text,
	colour text,
	embeddings text
);


create table clothing_photos (
	id serial primary key,
	catalog_id int references catalog,
	url text
);

create type recommendation_type as enum ('like', 'dislike', 'to_show');

create table recommendations (
	id serial primary key,
	creation_date timestamp,
	user_id int references user_info,
	r_type recommendation_type,
	clothing_id int references catalog
);