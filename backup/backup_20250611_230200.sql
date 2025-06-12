--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: inspectionstatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.inspectionstatus AS ENUM (
    'good',
    'needs_attention',
    'moderate',
    'excellent'
);


ALTER TYPE public.inspectionstatus OWNER TO admin;

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
    'cancelled',
    'pending'
);


ALTER TYPE public.status OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: inspection; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.inspection (
    inspection_id integer NOT NULL,
    vehicle_id integer,
    user_id integer,
    type public.inspectiontype,
    tires public.inspectionstatus,
    brakes public.inspectionstatus,
    lights public.inspectionstatus,
    fluids public.inspectionstatus,
    mirrors public.inspectionstatus,
    wipers public.inspectionstatus,
    battery public.inspectionstatus,
    body public.inspectionstatus,
    interior public.inspectionstatus,
    engine public.inspectionstatus,
    transmission public.inspectionstatus,
    suspension public.inspectionstatus,
    date date,
    signed_by character varying
);


ALTER TABLE public.inspection OWNER TO admin;

--
-- Name: inspection_inspection_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.inspection_inspection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspection_inspection_id_seq OWNER TO admin;

--
-- Name: inspection_inspection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.inspection_inspection_id_seq OWNED BY public.inspection.inspection_id;


--
-- Name: servicehistory; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.servicehistory (
    service_id integer NOT NULL,
    vehicle_vin character varying,
    service_date date,
    service_mileage integer
);


ALTER TABLE public.servicehistory OWNER TO admin;

--
-- Name: servicehistory_service_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.servicehistory_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servicehistory_service_id_seq OWNER TO admin;

--
-- Name: servicehistory_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.servicehistory_service_id_seq OWNED BY public.servicehistory.service_id;


--
-- Name: servicenotification; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.servicenotification (
    notification_id integer NOT NULL,
    vehicle_id integer,
    service_date date,
    notified boolean
);


ALTER TABLE public.servicenotification OWNER TO admin;

--
-- Name: servicenotification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.servicenotification_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servicenotification_notification_id_seq OWNER TO admin;

--
-- Name: servicenotification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.servicenotification_notification_id_seq OWNED BY public.servicenotification.notification_id;


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
    fuel_consumed double precision,
    trip_status public.status
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


ALTER SEQUENCE public.trip_trip_id_seq OWNER TO admin;

--
-- Name: trip_trip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.trip_trip_id_seq OWNED BY public.trip.trip_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying,
    email character varying,
    hashed_password character varying,
    role public.role,
    vehicle_id integer
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: vehicle; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.vehicle (
    id integer NOT NULL,
    vin character varying,
    make character varying NOT NULL,
    model character varying NOT NULL,
    year integer NOT NULL,
    licence_plate character varying,
    fuel_type character varying,
    mileage integer NOT NULL,
    last_service_date date NOT NULL,
    last_service_km integer NOT NULL
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


ALTER SEQUENCE public.vehicle_id_seq OWNER TO admin;

--
-- Name: vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.vehicle_id_seq OWNED BY public.vehicle.id;


--
-- Name: inspection inspection_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inspection ALTER COLUMN inspection_id SET DEFAULT nextval('public.inspection_inspection_id_seq'::regclass);


--
-- Name: servicehistory service_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicehistory ALTER COLUMN service_id SET DEFAULT nextval('public.servicehistory_service_id_seq'::regclass);


--
-- Name: servicenotification notification_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicenotification ALTER COLUMN notification_id SET DEFAULT nextval('public.servicenotification_notification_id_seq'::regclass);


--
-- Name: trip trip_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.trip ALTER COLUMN trip_id SET DEFAULT nextval('public.trip_trip_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: vehicle id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.vehicle ALTER COLUMN id SET DEFAULT nextval('public.vehicle_id_seq'::regclass);


--
-- Data for Name: inspection; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.inspection (inspection_id, vehicle_id, user_id, type, tires, brakes, lights, fluids, mirrors, wipers, battery, body, interior, engine, transmission, suspension, date, signed_by) FROM stdin;
2	3	3	pre_trip	good	good	good	good	good	good	good	good	good	good	good	good	2025-05-21	
1	1	2	pre_trip	excellent	excellent	excellent	excellent	excellent	excellent	excellent	excellent	excellent	excellent	good	good	2025-05-18	Comfort
\.


--
-- Data for Name: servicehistory; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.servicehistory (service_id, vehicle_vin, service_date, service_mileage) FROM stdin;
1	CORRL122GBB	2025-06-04	76000
\.


--
-- Data for Name: servicenotification; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.servicenotification (notification_id, vehicle_id, service_date, notified) FROM stdin;
\.


--
-- Data for Name: trip; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.trip (trip_id, vehicle_id, user_id, start_location, destination, purpose, trip_date, distance, fuel_consumed, trip_status) FROM stdin;
1	1	2	Cape Town	Jozi	Deliver computers	2025-05-18	1200	110	completed
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (user_id, name, email, hashed_password, role, vehicle_id) FROM stdin;
1	Thando	thando@gmail.com	thando123	admin	\N
3	Mpho	mpho@gmail.com	mpho123	employee	\N
4	Mongezi	mongezi@gmail.com	mongezi1234	employee	\N
2	Comfort	comfort@gmail.com	comfort1234	employee	\N
\.


--
-- Data for Name: vehicle; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.vehicle (id, vin, make, model, year, licence_plate, fuel_type, mileage, last_service_date, last_service_km) FROM stdin;
2	TCP1222WWEE34	Bakkie	Hilux Legend	2025	TCP122WC	Diesel	75000	2025-05-18	60000
3	SC112TRR56	Truck	Scannia	2025	SCN111GP	Diesel	100000	2025-05-18	90000
4	CORRL122GBB	car	corolla	2025	COR123GP	Petrol	76000	2025-05-18	76000
1	QRRT1222WRT	Bakkie	Ford Ranger 	2025	KDR130MP	Diesel	94200	2025-05-18	90000
\.


--
-- Name: inspection_inspection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.inspection_inspection_id_seq', 2, true);


--
-- Name: servicehistory_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.servicehistory_service_id_seq', 1, true);


--
-- Name: servicenotification_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.servicenotification_notification_id_seq', 1, false);


--
-- Name: trip_trip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.trip_trip_id_seq', 1, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- Name: vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.vehicle_id_seq', 4, true);


--
-- Name: inspection inspection_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inspection
    ADD CONSTRAINT inspection_pkey PRIMARY KEY (inspection_id);


--
-- Name: servicehistory servicehistory_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicehistory
    ADD CONSTRAINT servicehistory_pkey PRIMARY KEY (service_id);


--
-- Name: servicenotification servicenotification_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicenotification
    ADD CONSTRAINT servicenotification_pkey PRIMARY KEY (notification_id);


--
-- Name: trip trip_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_pkey PRIMARY KEY (trip_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (id);


--
-- Name: ix_inspection_inspection_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_inspection_inspection_id ON public.inspection USING btree (inspection_id);


--
-- Name: ix_inspection_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_inspection_user_id ON public.inspection USING btree (user_id);


--
-- Name: ix_inspection_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_inspection_vehicle_id ON public.inspection USING btree (vehicle_id);


--
-- Name: ix_servicehistory_service_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_servicehistory_service_id ON public.servicehistory USING btree (service_id);


--
-- Name: ix_servicehistory_vehicle_vin; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_servicehistory_vehicle_vin ON public.servicehistory USING btree (vehicle_vin);


--
-- Name: ix_servicenotification_notification_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_servicenotification_notification_id ON public.servicenotification USING btree (notification_id);


--
-- Name: ix_servicenotification_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_servicenotification_vehicle_id ON public.servicenotification USING btree (vehicle_id);


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
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_users_user_id ON public.users USING btree (user_id);


--
-- Name: ix_users_vehicle_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_users_vehicle_id ON public.users USING btree (vehicle_id);


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
-- Name: inspection inspection_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inspection
    ADD CONSTRAINT inspection_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: inspection inspection_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inspection
    ADD CONSTRAINT inspection_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- Name: servicehistory servicehistory_vehicle_vin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicehistory
    ADD CONSTRAINT servicehistory_vehicle_vin_fkey FOREIGN KEY (vehicle_vin) REFERENCES public.vehicle(vin);


--
-- Name: servicenotification servicenotification_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicenotification
    ADD CONSTRAINT servicenotification_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


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
-- Name: users users_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id);


--
-- PostgreSQL database dump complete
--

