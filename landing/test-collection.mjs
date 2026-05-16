import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
console.log(posts);
