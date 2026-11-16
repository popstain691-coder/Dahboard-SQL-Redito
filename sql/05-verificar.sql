-- Verificar: cada usuario con su número de publicaciones y los votos que suma
select u.nombre, u.rol, count(p.id) as publicaciones, coalesce(sum(p.votos), 0) as votos
from public.usuario u
left join public.publicacion p on p.autor_id = u.id
group by u.id
order by publicaciones desc;

-- Verificar: publicaciones por comunidad (join de las 3 tablas)
select c.nombre as comunidad, u.nombre as creador, count(p.id) as publicaciones
from public.comunidad c
join public.usuario u on u.id = c.creador_id
left join public.publicacion p on p.comunidad_id = c.id
group by c.id, u.nombre
order by publicaciones desc;
