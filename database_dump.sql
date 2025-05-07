--
-- PostgreSQL database dump
--

-- Dumped from database version 13.20 (Debian 13.20-1.pgdg120+1)
-- Dumped by pg_dump version 13.20 (Debian 13.20-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: inspectiontype; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.inspectiontype AS ENUM (
    'pre_trip',
    'post_trip'
);


ALTER TYPE public.inspectiontype OWNER TO admin;

--
-- Name: role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.role AS ENUM (
    'admin',
    'employee'
);


ALTER TYPE public.role OWNER TO admin;

--
-- Name: status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.status AS ENUM (
    'completed',
    'cancelled'
);


ALTER TYPE public.status OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Inspection; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Inspection" (
    inspection_id integer NOT NULL,
    user_id integer,
    type public.inspectiontype,
    date date,
    signed_by character varying
);


ALTER TABLE public."Inspection" OWNER TO admin;

--
-- Name: Inspection_inspection_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Inspection_inspection_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Inspection_inspection_id_seq" OWNER TO admin;

--
-- Name: Inspection_inspection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Inspection_inspection_id_seq" OWNED BY public."Inspection".inspection_id;


--
-- Name: ServiceHistory; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ServiceHistory" (
    service_id integer NOT NULL,
    vehicle_id integer,
    service_date date,
    service_mileage integer
);


ALTER TABLE public."ServiceHistory" OWNER TO admin;

--
-- Name: ServiceHistory_service_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ServiceHistory_service_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ServiceHistory_service_id_seq" OWNER TO admin;

--
-- Name: ServiceHistory_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ServiceHistory_service_id_seq" OWNED BY public."ServiceHistory".service_id;


--
-- Name: ServiceNotification; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ServiceNotification" (
    notification_id integer NOT NULL,
    vehicle_id integer,
    service_date date,
    notified boolean
);


ALTER TABLE public."ServiceNotification" OWNER TO admin;

--
-- Name: ServiceNotification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ServiceNotification_notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ServiceNotification_notification_id_seq" OWNER TO admin;

--
-- Name: ServiceNotification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ServiceNotification_notification_id_seq" OWNED BY public."ServiceNotification".notification_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying,
    email character varying,
    hashed_password character varying,
    role public.role
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: User_user_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."User_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_user_id_seq" OWNER TO admin;

--
-- Name: User_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."User_user_id_seq" OWNED BY public.users.user_id;


--
-- Name: service_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.service_history (
    id integer NOT NULL,
    vehicle_id character varying(50),
    servicedate date,
    servicemileage integer
);


ALTER TABLE public.service_history OWNER TO admin;

--
-- Name: service_history_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.service_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.service_history_id_seq OWNER TO admin;

--
-- Name: service_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.service_history_id_seq OWNED BY public.service_history.id;


--
-- Name: trip; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.trip (
    trip_id integer NOT NULL,
    vehicle_id integer,
    user_id integer,
    start_location character varying,
    destination character varying,
    purpose character varying,
    trip_date date,
    distance double precision,
    fuel_consumed double precision
);


ALTER TABLE public.trip OWNER TO admin;

--
-- Name: trip_trip_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.trip_trip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.trip_trip_id_seq OWNER TO admin;

--
-- Name: trip_trip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.trip_trip_id_seq OWNED BY public.trip.trip_id;


--
-- Name: vehicle; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.vehicle (
    id integer NOT NULL,
    vin character varying,
    make character varying,
    model character varying,
    year integer,
    licence_plate character varying,
    fuel_type character varying,
    mileage integer,
    last_service_date character varying,
    last_service_km integer
);


ALTER TABLE public.vehicle OWNER TO admin;

--
-- Name: vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vehicle_id_seq OWNER TO admin;

--
-- Name: vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.vehicle_id_seq OWNED BY public.vehicle.id;


--
-- Name: Inspection inspection_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inspection" ALTER COLUMN inspection_id SET DEFAULT nextval('public."Inspection_inspection_id_seq"'::regclass);


--
-- Name: ServiceHistory service_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ServiceHistory" ALTER COLUMN service_id SET DEFAULT nextval('public."ServiceHistory_service_id_seq"'::regclass);


--
-- Name: ServiceNotification notification_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ServiceNotification" ALTER COLUMN notification_id SET DEFAULT nextval('public."ServiceNotification_notification_id_seq"'::regclass);


--
-- Name: service_history id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.service_history ALTER COLUMN id SET DEFAULT nextval('public.service_history_id_seq'::regclass);


--
-- Name: trip trip_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.trip ALTER COLUMN trip_id SET DEFAULT nextval('public.trip_trip_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public."User_user_id_seq"'::regclass);


--
-- Name: vehicle id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.vehicle ALTER COLUMN id SET DEFAULT nextval('public.vehicle_id_seq'::regclass);


--
-- Data for Name: Inspection; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Inspection" (inspection_id, user_id, type, date, signed_by) FROM stdin;
\.


--
-- Data for Name: ServiceHistory; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ServiceHistory" (service_id, vehicle_id, service_date, service_mileage) FROM stdin;
\.


--
-- Data for Name: ServiceNotification; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ServiceNotification" (notification_id, vehicle_id, service_date, notified) FROM stdin;
\.


--
-- Data for Name: service_history; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.service_history (id, vehicle_id, servicedate, servicemileage) FROM stdin;
\.


--
-- Data for Name: trip; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.trip (trip_id, vehicle_id, user_id, start_location, destination, purpose, trip_date, distance, fuel_consumed) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (user_id, name, email, hashed_password, role) FROM stdin;
1	Thandi	thandi@example.com	thandi123	employee
2	Thando	thando@gmail.com	thando@#	admin
3	Evan	evan@gmail.com	evan123	employee
\.


--
-- Data for Name: vehicle; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.vehicle (id, vin, make, model, year, licence_plate, fuel_type, mileage, last_service_date, last_service_km) FROM stdin;
1	1HGCM82633A123456	Ford	Ranger Wildtrak	2022	ABC1234	Diesel	35000	2023-05-15	30000
2	2HGCM82633A123456	Toyota	Hilux 2.8	2022	JPG130MP	Diesel	50000	2023-05-15	45000
3	3HGCM82633A123456	Isuzu	D-MAX	2023	GCP140MP	Diesel	50000	2023-05-15	45000
4	5KGCM82633A123456	Truck	Mercedes Actros	2023	KLM324MP	Diesel	50000	2023-05-15	45000
\.


--
-- Name: Inspection_inspection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Inspection_inspection_id_seq"', 1, false);


--
-- Name: ServiceHistory_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ServiceHistory_service_id_seq"', 1, false);


--
-- Name: ServiceNotification_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ServiceNotification_notification_id_seq"', 1, false);


--
-- Name: User_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."User_user_id_seq"', 3, true);


--
-- Name: service_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.service_history_id_seq', 1, false);


--
-- Name: trip_trip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.trip_trip_id_seq', 1, false);


--
-- Name: vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.vehicle_id_seq', 4, true);


--
-- Name: Inspection Inspection_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inspection"
    ADD CONSTRAINT "Inspection_pkey" PRIMARY KEY (inspection_id);


--
-- Name: ServiceHistory ServiceHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ServiceHistory"
    ADD CONSTRAINT "ServiceHistory_pkey" PRIMARY KEY (service_id);


--
-- Name: ServiceNotification ServiceNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ServiceNotification"
    ADD CONSTRAINT "ServiceNotification_pkey" PRIMARY KEY (notification_id);


--
-- Name: users User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (user_id);


--
-- Name: service_history service_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.service_history
    ADD CONSTRAINT service_history_pkey PRIMARY KEY (id);


--
-- Name: trip trip_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_pkey PRIMARY KEY (trip_id);


--
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (id);


--
-- Name: ix_Inspection_inspection_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_Inspection_inspection_id" ON public."Inspection" USING btree (inspection_id);


--
-- Name: ix_Inspection_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_Inspection_user_id" ON public."Inspection" USING btree (user_id);


--
-- Name: ix_ServiceHistory_service_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_ServiceHistory_service_id" ON public."ServiceHistory" USING btree (service_id);


--
-- Name: ix_ServiceHistory_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_ServiceHistory_vehicle_id" ON public."ServiceHistory" USING btree (vehicle_id);


--
-- Name: ix_ServiceNotification_notification_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_ServiceNotification_notification_id" ON public."ServiceNotification" USING btree (notification_id);


--
-- Name: ix_ServiceNotification_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_ServiceNotification_vehicle_id" ON public."ServiceNotification" USING btree (vehicle_id);


--
-- Name: ix_User_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "ix_User_email" ON public.users USING btree (email);


--
-- Name: ix_User_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ix_User_user_id" ON public.users USING btree (user_id);


--
-- Name: ix_trip_trip_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_trip_trip_id ON public.trip USING btree (trip_id);


--
-- Name: ix_trip_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_trip_user_id ON public.trip USING btree (user_id);


--
-- Name: ix_trip_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_trip_vehicle_id ON public.trip USING btree (vehicle_id);


--
-- Name: ix_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_vehicle_id ON public.vehicle USING btree (id);


--
-- Name: ix_vehicle_licence_plate; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX ix_vehicle_licence_plate ON public.vehicle USING btree (licence_plate);


--
-- Name: ix_vehicle_vin; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX ix_vehicle_vin ON public.vehicle USING btree (vin);


--
-- Name: Inspection Inspection_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inspection"
    ADD CONSTRAINT "Inspection_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: ServiceHistory ServiceHistory_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ServiceHistory"
    ADD CONSTRAINT "ServiceHistory_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- Name: ServiceNotification ServiceNotification_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ServiceNotification"
    ADD CONSTRAINT "ServiceNotification_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- Name: service_history service_history_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.service_history
    ADD CONSTRAINT service_history_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vin);


--
-- Name: trip trip_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: trip trip_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- PostgreSQL database dump complete
--

