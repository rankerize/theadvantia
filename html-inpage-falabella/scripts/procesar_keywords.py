import sys
import re
import json

raw_data = """Keyword	Currency	Segmentation	Avg. monthly searches	Three month change	YoY change	Competition	Competition (indexed value)	Top of page bid (low range)	Top of page bid (high range)	Ad impression share	Organic average position	Organic impression share	In Account
acero al carbono sarten	COP		170.0	200%	133%	Alto	89	99.44	717.28
alkosto ollas	COP		590.0	83%	0%	Alto	100	157.21	745.98
antiadherente	COP		880.0	0%	-18%	Alto	69	231.64	1821.57
antiadherente triforce	COP		70.0	-40%	-67%	Alto	93
arrocera	COP		2900.0	24%	24%	Alto	99	89.64	577.80
arrocera electrica	COP		260.0	0%	52%	Alto	99	92.17	629.79
arrocera grande	COP		40.0	25%	67%	Alto	96	99.91	660.29
arrocera home elements	COP		140.0	0%	22%	Alto	100	68.11	394.48
arrocera imusa	COP		590.0	0%	-19%	Alto	100	136.28	863.78
arrocera imusa 5 tazas	COP		170.0	0%	0%	Alto	100	92.22	361.23
arrocera japonesa	COP		40.0	67%	0%	Alto	80	141.19	762.38
arrocera multifuncional	COP		70.0	0%	29%	Alto	100	77.13	679.14
arrocera oster	COP		720.0	23%	23%	Alto	99	124.06	873.56
arrocera pequeña	COP		480.0	50%	85%	Alto	99	67.94	474.80
arrocera precio	COP		90.0	40%	0%	Alto	98	41.09	269.63
arrocera universal	COP		170.0	-21%	-35%	Alto	100	57.62	899.44
arrocera vaporera	COP		90.0	22%	22%	Alto	100	120.35	597.11
arroceras	COP		2900.0	24%	24%	Alto	99	89.64	577.80
asador electrico home elements	COP		170.0	0%	0%	Alto	96	80.96	532.27
bandejas de barro	COP		140.0	-18%	0%	Alto	87
bateria acero inoxidable	COP		390.0	23%	0%	Alto	100	147.57	925.47
bateria acero quirurgico	COP		210.0	21%	0%	Alto	100	147.33	643.75
bateria ceramica	COP		90.0	22%	-21%	Alto	100	130.79	806.76
bateria cocina	COP		260.0	0%	-19%	Alto	100	246.60	1296.59
bateria cocina acero inoxidable	COP		50.0	0%	0%	Alto	100	189.25	636.47
bateria de acero inoxidable	COP		140.0	24%	0%	Alto	100	165.52	608.29
bateria de acero quirurgico	COP		50.0	0%	25%	Alto	100	126.10	679.82
bateria de ceramica	COP		70.0	0%	29%	Alto	100	99.44	533.17
bateria de cocina	COP		1900.0	23%	0%	Alto	100	157.77	998.96
bateria de cocina acero inoxidable	COP		320.0	23%	-18%	Alto	100	163.51	887.43
bateria de cocina acero quirurgico	COP		140.0	-22%	-22%	Alto	100	140.60	704.51
bateria de cocina ceramica	COP		70.0	0%	29%	Alto	100	115.66	756.90
bateria de cocina homecenter	COP		90.0	120%	57%	Alto	97	74.00	762.38
bateria de cocina imusa	COP		480.0	23%	84%	Alto	100	191.46	1215.15
bateria de cocina royal prestige	COP		110.0	0%	0%	Alto	99	51.67	577.23
bateria de cocina tefal	COP		50.0	0%	0%	Alto	100	293.29	1399.56
bateria de cocina tramontina	COP		90.0	57%	0%	Alto	100	100.32	833.28
bateria de ollas	COP		3600.0	0%	22%	Alto	100	200.90	1104.35
bateria de ollas acero inoxidable	COP		390.0	23%	-18%	Alto	100	143.18	849.78
bateria de ollas antiadherentes	COP		170.0	0%	0%	Alto	100	158.75	1205.58
bateria de ollas ceramica	COP		90.0	-21%	0%	Alto	100	201.10	1060.70
bateria de ollas en acero quirurgico	COP		320.0	52%	23%	Alto	100	117.84	645.87
bateria de ollas imusa	COP		1300.0	23%	23%	Alto	100	187.33	1091.70
bateria de ollas royal prestige	COP		170.0	136%	136%	Alto	95	57.91	590.13
bateria de ollas tramontina	COP		140.0	91%	0%	Alto	100	67.13	548.62
bateria de ollas universal	COP		480.0	23%	-19%	Alto	100	138.20	1001.96
bateria de sartenes	COP		70.0	0%	0%	Alto	100	187.20	1041.01
bateria imusa	COP		1000.0	23%	60%	Alto	100	231.59	1259.12
bateria imusa 11 piezas	COP		170.0	21%	-19%	Alto	100	193.09	1114.17
bateria imusa 7 piezas	COP		260.0	0%	-19%	Alto	100	144.27	1020.07
bateria imusa talent	COP		40.0	-40%	50%	Alto	98	260.26	1276.00
bateria ollas	COP		480.0	23%	23%	Alto	100	224.93	1426.59
bateria ollas acero inoxidable	COP		170.0	0%	-19%	Alto	100	153.68	985.39
bateria ollas ceramica	COP		50.0	67%	0%	Alto	100	212.64	1186.57
bateria ollas imusa	COP		210.0	24%	24%	Alto	100	286.23	1289.60
bateria ollas universal	COP		70.0	-29%	0%	Alto	100	216.82	956.31
bateria royal prestige	COP		210.0	129%	50%	Alto	97	53.03	589.96
bateria royal prestige 10 piezas precio	COP		110.0	0%	-79%	Alto	95	30.60	541.33
bateria t fal	COP		50.0	75%	40%	Alto	100	200.35	1701.18
bateria tefal	COP		70.0	40%	40%	Alto	100	214.58	1912.25
bateria tramontina	COP		110.0	91%	50%	Alto	100	68.37	763.74
bateria tramontina acero inoxidable	COP		30.0	133%	0%	Alto	100	73.71	592.99
batería de cocina antiadherente	COP		90.0	0%	0%	Alto	99	99.44	992.32
batería de ollas homecenter	COP		110.0	0%	-21%	Alto	100	77.49	819.60
belomatic ollas	COP		480.0	0%	0%	Alto	77	488.28	1259.58
bergner ollas	COP		110.0	57%	0%	Alto	100	58.35	669.97
bergner sartenes	COP		170.0	0%	-48%	Alto	100	80.68	762.38
black decker arrocera	COP		40.0	67%	150%	Alto	100	44.48	609.48
cacerola acero inoxidable	COP		70.0	0%	-29%	Alto	100	105.00	1362.65
cacerola hierro fundido	COP		70.0	-29%	-29%	Alto	100	198.54	1368.49
cacerola imusa	COP		390.0	23%	-18%	Alto	100	166.61	1007.64
cacerola para huevos	COP		590.0	22%	0%	Alto	97	190.08	958.76
cacerola para huevos imusa	COP		110.0	0%	-44%	Alto	100	107.92	698.14
cacerola vitroceramica	COP		50.0	-71%	Medio	51	298.38	2452.86
cacerolas	COP		260.0	52%	52%	Alto	91	141.02	1680.69
cacerolas antiadherentes	COP		110.0	29%	29%	Alto	100	128.90	905.16
cacerolas de acero inoxidable	COP		90.0	0%	0%	Alto	90	248.28	818.27
cacerolas de ceramica	COP		40.0	-20%	-20%	Alto	92	353.46	1733.07
cacerolas de hierro fundido	COP		110.0	91%	50%	Alto	100	132.59	995.66
cacerolas royal prestige	COP		70.0	29%	29%	Alto	86	40.17	583.60
caldero hierro fundido	COP		70.0	57%	57%	Alto	85	165.73	753.00
calderos de hierro	COP		140.0	100%	0%	Alto	94	140.62	550.42
calderos de hierro fundido	COP		210.0	23%	23%	Alto	93	93.03	636.86
calderos grandes industriales	COP		140.0	0%	-36%	Medio	56	75.39	898.91
carote sartenes	COP		30.0	0%	133%	Alto	100	74.61	596.64
catalogo royal prestige	COP		480.0	24%	24%	Bajo	28	32.67	249.51
cazuelas de barro	COP		320.0	24%	-19%	Alto	75	82.19	961.26
chocolatera electrica imusa	COP		320.0	0%	-56%	Alto	75	99.62	322.23
chocolatera royal prestige	COP		1300.0	-12%	22%	Alto	88	47.10	266.77
chocolatera royal prestige precio	COP		170.0	-18%	0%	Medio	41	26.93	312.07
cocina wok	COP		140.0	0%	22%	Alto	89	333.55	1060.09
cuisinart ollas	COP		210.0	0%	0%	Alto	95	53.78	933.27
el sarten	COP		50.0	-20%	-43%	Bajo	0
el teflon es toxico	COP		90.0	0%	-56%	Bajo	0
el wok	COP		50.0	25%	25%	Bajo	1
es toxico el teflon	COP		90.0	0%	-56%	Bajo	0
estufa para wok	COP		70.0	-22%	0%	Alto	84	138.85	703.71
estufa wok	COP		110.0	80%	0%	Alto	86	126.62	1010.29
exito sartenes	COP		70.0	75%	40%	Alto	97	36.27	541.92
falabella olla a presion	COP		110.0	0%	-18%	Alto	100	221.34	1021.28
falabella olla arrocera	COP		140.0	-22%	-22%	Alto	100	150.98	528.74
falabella ollas	COP		320.0	23%	0%	Alto	100	236.84	853.53
falabella sarten	COP		110.0	27%	56%	Alto	100	202.77	763.53
farberware ollas	COP		90.0	-18%	-18%	Alto	100	88.92	654.78
fissler ollas	COP		50.0	75%	40%	Alto	96	99.44	687.13
hoffman ollas	COP		170.0	0%	-33%	Alto	100	121.46	730.56
home elements olla arrocera	COP		70.0	75%	40%	Alto	100	101.49	875.63
home elements ollas	COP		110.0	-20%	-56%	Alto	100	102.15	746.72
homecenter olla a presion	COP		260.0	86%	0%	Alto	100	66.87	596.33
homecenter ollas	COP		590.0	0%	-19%	Alto	100	68.16	765.01
homecenter sartenes	COP		320.0	22%	0%	Alto	99	43.11	554.56
hoya de cocina	COP		320.0	53%	53%	Bajo	32
hoya de presion	COP		170.0	0%	-19%	Alto	99	119.22	663.30
hoya y olla	COP		1300.0	0%	0%	Bajo	1
ilko sartenes	COP		170.0	24%	86%	Alto	96	77.81	449.36
imusa acero inoxidable	COP		170.0	23%	0%	Alto	100	153.67	1337.18
imusa antiadherente	COP		70.0	40%	0%	Alto	93	246.10	1380.55
imusa bateria de ollas	COP		70.0	0%	240%	Alto	100	254.15	1627.13
imusa easy fry	COP		110.0	-22%	-22%	Alto	98	291.05	1528.26
imusa multichef	COP		110.0	0%	-44%	Alto	91	504.42	2032.83
imusa olla multifuncional	COP		320.0	50%	177%	Alto	100	284.80	1323.53
imusa olla presion	COP		390.0	0%	23%	Alto	100	318.76	1691.23
imusa ollas	COP		3600.0	0%	0%	Alto	100	205.81	1354.18
imusa sarten	COP		5400.0	0%	-19%	Alto	100	156.75	985.56
imusa talent 7 piezas	COP		30.0	-25%	50%	Alto	100	272.76	1459.67
imusa talent master	COP		70.0	-22%	0%	Alto	100	231.74	1707.22
instant pot olla	COP		390.0	-19%	0%	Alto	100	66.29	707.02
jarra imusa	COP		210.0	50%	0%	Alto	94	163.05	960.66
kitchenaid sartenes	COP		90.0	56%	0%	Alto	100	99.44	927.43
la victoria sartenes	COP		70.0	29%	0%	Alto	90	205.64	1672.99
las mejores ollas para cocinar	COP		70.0	67%	-29%	Alto	100	161.06	644.80
le creuset ollas	COP		260.0	-19%	-19%	Alto	95	99.44	1220.92
le creuset sartenes	COP		50.0	0%	0%	Alto	87	167.75	2358.32
libre de pfoa	COP		50.0	-29%	-29%	Bajo	17
mango de sarten	COP		50.0	25%	0%	Alto	82
mangos para sartenes	COP		70.0	-29%	-29%	Alto	100	50.45	367.05
marcas de ollas	COP		320.0	22%	0%	Alto	87	320.16	992.00
marcas de ollas a presion	COP		90.0	0%	-36%	Alto	88	223.33	956.83
marcas de sartenes	COP		70.0	0%	-18%	Alto	93	408.10	947.52
marcas de sartenes libres de toxicos	COP		110.0	0%	-55%	Alto	98	172.49	668.37
mejores marcas de ollas	COP		70.0	-20%	-43%	Alto	100	432.12	1929.55
mejores materiales para ollas	COP		90.0	-29%	-44%	Alto	100	393.17	982.81
mejores ollas a presion	COP		50.0	0%	40%	Alto	100	265.17	1015.11
mejores ollas para cocinar	COP		110.0	57%	0%	Alto	100	365.03	844.58
mercado libre olla a presion	COP		110.0	22%	120%	Alto	100	117.08	627.76
mercado libre ollas de acero inoxidable	COP		70.0	0%	100%	Alto	100	167.51	656.56
mini arrocera	COP		110.0	55%	55%	Alto	95	87.51	463.49
mini olla a presion	COP		70.0	0%	0%	Alto	95	83.99	582.10
mini olla arrocera	COP		480.0	22%	-19%	Alto	99	99.44	602.34
multi olla oster	COP		70.0	33%	-43%	Alto	97	234.98	643.47
multicooker black and decker	COP		140.0	56%	56%	Alto	100	238.01	935.96
multifuncional olla	COP		260.0	23%	23%	Alto	100	105.53	720.02
multiolla	COP		170.0	22%	-66%	Alto	100	126.42	535.58
multiolla oster	COP		320.0	0%	-34%	Alto	98	243.98	1196.64
ninja olla	COP		50.0	22%	57%	Alto	92	51.19	739.97
olla 10 litros	COP		40.0	0%	-20%	Alto	92	344.17	1106.77
olla 20 litros	COP		50.0	80%	29%	Alto	86	285.23	1880.71
olla 40 litros	COP		50.0	75%	0%	Alto	87	198.96	1189.70
olla 50 litros	COP		50.0	40%	133%	Alto	85	232.14	2052.19
olla a	COP		40.0	40%	0%	Alto	90	62.28	800.28
olla a presion	COP		12100.0	22%	0%	Alto	100	127.23	919.29
olla a presion 10 litros	COP		170.0	24%	0%	Alto	100	175.49	1090.60
olla a presion 6 litros	COP		260.0	23%	0%	Alto	100	143.43	977.83
olla a presion 8 litros	COP		70.0	0%	0%	Alto	86	215.98	955.88
olla a presion acero inoxidable	COP		480.0	23%	0%	Alto	100	165.73	928.11
olla a presion black and decker	COP		210.0	0%	-19%	Alto	100	260.34	1042.93
olla a presion corona	COP		170.0	-33%	-33%	Alto	100	139.80	961.81
olla a presion digital	COP		320.0	24%	0%	Alto	100	153.44	928.11
olla a presion electrica	COP		1300.0	50%	50%	Alto	100	119.16	807.83
olla a presion home elements 4.2 litros	COP		90.0	-20%	-20%	Alto	100	63.67	886.71
olla a presion imusa	COP		3600.0	24%	0%	Alto	100	187.59	1044.68
olla a presion imusa 4.5 litros	COP		210.0	0%	-50%	Alto	100	145.49	1058.58
olla a presion imusa 6 litros	COP		880.0	0%	-18%	Alto	100	141.02	949.73
olla a presion imusa 7 litros	COP		320.0	0%	-33%	Alto	100	179.49	847.43
olla a presion industrial	COP		260.0	23%	23%	Alto	95	116.08	1126.50
olla a presion multifuncional	COP		260.0	23%	0%	Alto	100	268.25	1274.23
olla a presion oster	COP		320.0	0%	0%	Alto	100	156.98	900.47
olla a presion pequeña	COP		720.0	22%	22%	Alto	100	88.18	618.62
olla a presion precio	COP		170.0	21%	0%	Alto	100	46.24	544.07
olla a presion rena ware	COP		110.0	29%	0%	Alto	86	177.37	663.74
olla a presion royal prestige	COP		1900.0	116%	-34%	Alto	96	61.82	591.01
olla a presion tefal	COP		320.0	0%	0%	Alto	100	255.46	1702.52
olla a presion tramontina	COP		140.0	56%	-33%	Alto	100	96.91	596.64
olla a presion umco	COP		90.0	75%	0%	Alto	91	100.83	661.48
olla a presion universal de 4 litros	COP		170.0	0%	-21%	Alto	100	108.56	808.61
olla a presión 1 litro	COP		170.0	0%	0%	Alto	88	67.36	532.31
olla a presión 1 litro imusa	COP		210.0	-50%	-78%	Alto	89	99.44	596.64
olla a presión 1.5 litros	COP		210.0	0%	-71%	Medio	60	65.90	563.08
olla a presión 2 litros	COP		590.0	23%	0%	Alto	100	102.54	699.35
olla a presión 2 litros imusa	COP		140.0	40%	-36%	Alto	93	99.44	514.38
olla a presión 3 litros	COP		170.0	24%	24%	Alto	100	150.51	827.20
olla a presión 4 litros	COP		320.0	23%	0%	Alto	100	154.34	1015.25
olla a presión 4 litros universal	COP		170.0	-44%	-64%	Alto	100	98.27	668.71
olla a presión 5 litros	COP		50.0	75%	75%	Alto	98	128.94	809.36
olla a presión antigua	COP		210.0	33%	-56%	Alto	72
olla a presión corona 4 litros	COP		90.0	0%	-56%	Alto	100	55.08	628.41
olla a presión de 4 litros	COP		110.0	0%	56%	Alto	100	66.29	535.11
olla a presión eléctrica oster	COP		70.0	200%	29%	Alto	96	165.73	777.13
olla a presión falabella	COP		70.0	0%	-22%	Alto	100	261.73	843.27
olla a presión grande	COP		170.0	0%	24%	Alto	100	105.22	755.42
olla a presión home elements	COP		1000.0	0%	-18%	Alto	100	82.20	823.61
olla a presión homecenter	COP		320.0	23%	0%	Alto	100	41.78	538.03
olla a presión imusa 3 litros	COP		210.0	22%	-35%	Alto	100	165.73	843.43
olla a presión imusa 4 litros	COP		480.0	0%	-19%	Alto	100	148.52	848.70
olla a presión imusa 4 litros precio	COP		110.0	-44%	-29%	Alto	99	58.65	616.23
olla a presión imusa 6 litros	COP		880.0	0%	-18%	Alto	100	141.02	949.73
olla a presión imusa 6 litros precio	COP		90.0	-20%	-20%	Alto	97	44.95	861.66
olla a presión imusa 7 litros	COP		390.0	23%	-18%	Alto	100	159.43	932.48
olla a presión industrial 50 litros	COP		110.0	-18%	-36%	Alto	95	99.44	758.65
olla a presión inteligente	COP		90.0	27%	0%	Alto	100	133.43	762.38
olla a presión kalley 4 litros	COP		170.0	27%	-18%	Alto	91	230.04	2973.30
olla a presión kalley 6 litros	COP		260.0	50%	85%	Alto	100	260.34	2262.62
olla a presión pequeña 1 litro	COP		590.0	0%	-34%	Alto	86	47.48	536.10
olla a presión royal prestige	COP		210.0	136%	-56%	Alto	99	66.57	572.80
olla a presión royal prestige precio	COP		210.0	86%	24%	Alto	89	60.54	566.50
olla a presión universal	COP		5400.0	22%	0%	Alto	100	106.22	970.80
olla a presión universal 10 litros	COP		70.0	-43%	-20%	Alto	99	103.77	793.58
olla a presión universal 2 litros	COP		480.0	24%	-33%	Alto	88	90.59	738.97
olla a presión universal 3 litros precio	COP		170.0	-60%	-86%	Alto	84	32.76	340.21
olla a presión universal 4 litros	COP		880.0	-18%	-18%	Alto	100	79.39	722.19
olla a presión universal 4 litros éxito	COP		210.0	0%	0%	Alto	88	42.73	765.47
olla a presión universal 6 litros	COP		1600.0	14%	-38%	Alto	100	119.55	922.71
olla a presión universal 6 litros acero inoxidable	COP		170.0	29%	-18%	Alto	99	175.80	916.95
olla a presión universal 6 litros éxito	COP		210.0	0%	22%	Alto	67	37.01	557.74
olla a vapor	COP		590.0	23%	-19%	Alto	91	111.63	816.89
olla a vapor eléctrica	COP		90.0	0%	-40%	Alto	100
olla air fryer	COP		390.0	0%	0%	Alto	100	108.05	899.31
olla airfryer	COP		880.0	0%	14%	Alto	98	99.73	850.15
olla airfryer oster	COP		210.0	0%	0%	Alto	94	150.83	778.23
olla al vapor	COP		590.0	23%	-19%	Alto	91	111.63	816.89
olla aluminio	COP		260.0	24%	-19%	Alto	96	154.29	1203.21
olla antigua	COP		70.0	75%	40%	Bajo	30
olla arrocera	COP		12100.0	0%	0%	Alto	100	90.39	600.74
olla arrocera 1 libra	COP		170.0	0%	0%	Alto	100	101.57	526.51
olla arrocera black and decker	COP		720.0	22%	126%	Alto	100	95.69	646.40
olla arrocera con vaporera	COP		170.0	22%	-21%	Alto	100	94.58	513.49
olla arrocera digital	COP		90.0	-36%	-36%	Alto	100	164.62	700.01
olla arrocera electrica	COP		90.0	22%	22%	Alto	100	104.56	728.81
olla arrocera electrolux	COP		90.0	56%	27%	Alto	100	135.46	679.55
olla arrocera exito	COP		260.0	0%	21%	Alto	95	52.01	455.44
olla arrocera grande	COP		140.0	55%	21%	Alto	100	66.28	648.30
olla arrocera home elements 1 litro	COP		110.0	0%	75%	Alto	98	46.18	268.56
olla arrocera imusa	COP		1300.0	0%	-32%	Alto	99	188.83	1083.69
olla arrocera imusa 1 libra precio	COP		260.0	-36%	-67%	Medio	65	37.57	596.64
olla arrocera imusa 5 tazas	COP		390.0	24%	-19%	Alto	100	108.77	788.38
olla arrocera multifuncional	COP		210.0	0%	24%	Alto	100	96.45	635.54
olla arrocera multiusos	COP		50.0	100%	0%	Alto	100	96.64	497.20
olla arrocera oster	COP		1600.0	22%	-12%	Alto	98	100.31	690.65
olla arrocera oster 1 libra	COP		140.0	-25%	-57%	Alto	96	65.48	394.65
olla arrocera oster pequeña	COP		170.0	57%	0%	Alto	95	77.46	603.21
olla arrocera oster precio	COP		320.0	-18%	-47%	Medio	62	66.63	601.23
olla arrocera pequeña	COP		2400.0	53%	21%	Alto	100	68.41	452.22
olla arrocera precio	COP		480.0	22%	22%	Alto	91	34.34	281.50
olla arrocera universal	COP		880.0	0%	0%	Alto	96	77.55	808.20
olla arrocera universal 1 libra	COP		140.0	0%	-71%	Alto	100
olla arrocera whiteline 1.2 litros precio	COP		140.0	0%	-25%	Medio	41
olla arrocera éxito	COP		260.0	0%	21%	Alto	95	52.01	455.44
olla autoclave	COP		90.0	120%	57%	Bajo	26	132.59	3036.90
olla baño maria	COP		170.0	56%	-18%	Alto	90	99.44	752.14
olla black and decker	COP		590.0	0%	0%	Alto	99	184.90	825.22
olla black and decker multifuncional	COP		110.0	88%	700%	Alto	100	195.58	877.88
olla blanca	COP		50.0	0%	40%	Alto	97	96.63	894.68
olla bruja	COP		90.0	-22%	-22%	Bajo	11
olla caldero	COP		90.0	0%	0%	Alto	96	60.77	875.90
olla ceramica	COP		1300.0	23%	23%	Alto	100	103.50	696.08
olla chocolatera	COP		320.0	22%	22%	Alto	97	174.72	906.63
olla cobre	COP		70.0	0%	40%	Alto	91	62.75	543.42
olla coccion lenta	COP		590.0	0%	-19%	Alto	100	99.44	609.12
olla crispetera	COP		260.0	-19%	-34%	Alto	96	73.01	478.06
olla crock pot	COP		70.0	-25%	-57%	Alto	100	66.29	2640.39
olla cuadrada	COP		50.0	-25%	-40%	Alto	97
olla de	COP		70.0	0%	-22%	Medio	52
olla de 10 litros	COP		70.0	29%	0%	Alto	85	70.57	697.79
olla de 20 litros	COP		70.0	29%	29%	Alto	77	92.58	474.11
olla de 30 litros	COP		50.0	67%	0%	Alto	93	192.84	1152.47
olla de 40 litros	COP		70.0	-29%	-29%	Alto	77
olla de 50 litros	COP		50.0	80%	125%	Medio	60	57.59	438.22
olla de 6 litros	COP		40.0	-40%	-40%	Alto	98	67.83	477.39
olla de aire	COP		720.0	0%	0%	Alto	99	90.36	728.75
olla de aire imusa	COP		110.0	29%	0%	Alto	100	173.89	1293.00
olla de aire oster	COP		260.0	0%	21%	Alto	100	127.33	734.03
olla de barro	COP		880.0	0%	-18%	Alto	67	64.59	364.61
olla de barro precio	COP		110.0	-18%	-18%	Alto	77
olla de ceramica	COP		880.0	30%	30%	Alto	100	110.62	696.08
olla de cobre	COP		110.0	22%	22%	Alto	83	36.26	405.24
olla de coccion	COP		590.0	0%	-19%	Alto	100	99.44	609.12
olla de coccion lenta	COP		590.0	0%	-19%	Alto	100	99.44	609.12
olla de cristal	COP		90.0	-20%	-43%	Alto	93	99.44	539.02
olla de fondue	COP		70.0	25%	0%	Alto	96	118.73	790.34
olla de hierro	COP		390.0	22%	-19%	Alto	92	132.59	734.68
olla de hierro fundido imusa	COP		210.0	24%	-19%	Alto	100	105.02	672.21
olla de peltre	COP		590.0	22%	0%	Alto	91	90.63	874.12
olla de peltre para hervir agua	COP		140.0	-50%	0%	Alto	85	45.63	395.75
olla de presion	COP		3600.0	22%	0%	Alto	100	108.36	902.05
olla de presion 6 litros	COP		70.0	57%	57%	Alto	100	102.07	998.54
olla de presion acero inoxidable	COP		50.0	80%	0%	Alto	100	106.16	710.20
olla de presion black and decker	COP		210.0	0%	-18%	Alto	100	172.92	1098.69
olla de presion digital	COP		70.0	80%	0%	Alto	100	65.52	928.11
olla de presion electrica	COP		480.0	39%	69%	Alto	100	75.78	644.04
olla de presion home elements	COP		90.0	40%	0%	Alto	100	38.31	321.66
olla de presion imusa	COP		1000.0	0%	0%	Alto	100	159.33	954.11
olla de presion industrial	COP		70.0	0%	-44%	Alto	90	87.18	1060.70
olla de presion multifuncional	COP		70.0	22%	22%	Alto	100	183.68	807.63
olla de presion oster	COP		90.0	0%	-22%	Alto	99	101.22	616.81
olla de presion royal prestige	COP		320.0	52%	-18%	Alto	86	56.14	596.64
olla de presion universal	COP		590.0	0%	0%	Alto	100	119.44	918.26
olla de presión grande	COP		50.0	29%	125%	Alto	92	126.80	697.34
olla de presión moderna	COP		40.0	0%	0%	Alto	97	78.27	628.30
olla de presión pequeña	COP		140.0	21%	21%	Alto	96	48.48	561.16
olla de presión royal prestige 6 litros precio	COP		260.0	89%	-65%	Medio	52	41.59	750.12
olla de presión royal prestige precio	COP		140.0	80%	-36%	Medio	46	25.04	327.00
olla de sancocho	COP		320.0	24%	0%	Medio	56	101.90	687.03
olla de sopa	COP		140.0	55%	-19%	Alto	78	78.59	1030.43
olla de tamales	COP		50.0	67%	0%	Medio	63
olla de vapor	COP		140.0	56%	56%	Alto	89	112.37	753.88
olla digital	COP		90.0	0%	29%	Alto	100	131.78	677.64
olla electrica	COP		1000.0	14%	0%	Alto	100	84.52	596.64
olla electrica black and decker	COP		110.0	0%	22%	Alto	100	163.87	875.15
olla electrica home elements	COP		110.0	-20%	-56%	Alto	91	47.21	596.64
olla electrica multifuncional	COP		720.0	22%	22%	Alto	100	92.20	694.79
olla electrica oster	COP		70.0	75%	0%	Alto	100	96.14	574.49
olla esmaltada	COP		880.0	0%	0%	Alto	92	101.47	890.38
olla esmaltada homecenter	COP		50.0	-20%	-20%	Alto	96	69.19	449.46
olla esmaltada imusa	COP		110.0	80%	-18%	Medio	58	114.63	567.55
olla esmaltada para teteros	COP		140.0	50%	133%	Medio	63	80.52	688.68
olla express	COP		9900.0	22%	22%	Alto	100	97.68	751.71
olla express 10 litros	COP		50.0	75%	40%	Alto	100	99.44	757.92
olla express 2 litros	COP		110.0	0%	0%	Alto	99	65.23	468.38
olla express 3 litros	COP		70.0	-44%	-44%	Alto	95	91.69	886.06
olla express 4 litros	COP		140.0	89%	21%	Alto	99	79.15	606.65
olla express 6 litros	COP		110.0	55%	55%	Alto	100	158.41	1078.75
olla express acero inoxidable	COP		70.0	22%	22%	Alto	100	164.35	837.79
olla express de 2 litros	COP		50.0	40%	40%	Alto	100	60.83	567.34
olla express de 4 litros	COP		50.0	-22%	75%	Alto	95	68.14	395.18
olla express de 6 litros	COP		40.0	40%	40%	Alto	99	51.50	544.74
olla express digital	COP		170.0	21%	0%	Alto	100	71.96	728.02
olla express electrica	COP		590.0	14%	14%	Alto	100	78.55	596.31
olla express grande	COP		50.0	0%	80%	Alto	100	79.19	538.23
olla express home elements	COP		1000.0	0%	-18%	Alto	100	82.20	823.61
olla express imusa	COP		1900.0	23%	0%	Alto	100	220.10	934.08
olla express imusa 6 litros	COP		260.0	-19%	0%	Alto	100	126.46	856.04
olla express imusa 7 litros	COP		170.0	56%	27%	Alto	100	185.36	857.16
olla express industrial	COP		110.0	55%	21%	Alto	98	105.07	689.20
olla express mercado libre	COP		70.0	75%	40%	Alto	99	132.53	668.86
olla express oster	COP		110.0	56%	0%	Alto	98	234.60	932.62
olla express pequeña	COP		320.0	50%	50%	Alto	98	66.63	508.43
olla express pequeña 2 litros	COP		110.0	0%	-18%	Alto	99	47.92	362.14
olla express royal prestige	COP		1900.0	116%	-34%	Alto	96	61.82	591.01
olla express royal prestige precio	COP		170.0	180%	-33%	Alto	74	63.32	546.37
olla express tefal	COP		70.0	29%	0%	Alto	99	162.06	781.17
olla express universal	COP		2400.0	0%	-17%	Alto	100	139.08	949.97
olla express universal 4 litros	COP		210.0	24%	24%	Alto	100	111.17	737.23
olla express universal 6 litros	COP		390.0	0%	-19%	Alto	98	99.62	772.23
olla farberware	COP		90.0	-18%	-18%	Alto	100	88.92	654.78
olla fissler	COP		50.0	75%	40%	Alto	96	99.44	687.13
olla fondue	COP		140.0	29%	0%	Alto	96	116.60	704.88
olla freidora	COP		2900.0	19%	-21%	Alto	100	93.24	677.76
olla freidora de aire	COP		3600.0	0%	-21%	Alto	100	80.40	558.31
olla freidora de aire imusa	COP		210.0	27%	-18%	Alto	100	108.78	707.77
olla freidora de aire oster	COP		480.0	-18%	-33%	Alto	100	136.47	780.39
olla freidora electrica	COP		70.0	50%	-57%	Alto	100
olla freidora imusa	COP		390.0	24%	-19%	Alto	100	195.89	997.63
olla freidora oster	COP		720.0	22%	-19%	Alto	100	112.46	918.96
olla freidora precio	COP		70.0	0%	-29%	Medio	61
olla gigante	COP		70.0	75%	0%	Alto	89	173.62	1568.34
olla grande	COP		480.0	51%	23%	Alto	92	110.17	803.40
olla grande 50 litros	COP		110.0	29%	-47%	Alto	94	75.21	1092.97
olla grande para sancocho	COP		110.0	0%	21%	Alto	90	73.36	640.97
olla hamilton beach	COP		110.0	133%	320%	Alto	99	66.29	784.79
olla hierro	COP		70.0	40%	40%	Alto	100	151.72	977.68
olla hierro fundicion	COP		480.0	23%	0%	Alto	97	139.79	908.28
olla hierro fundido	COP		480.0	23%	0%	Alto	97	139.79	908.28
olla holandesa	COP		50.0	-18%	0%	Alto	98	161.22	861.66
olla home elements	COP		390.0	23%	0%	Alto	100	119.37	671.22
olla horno	COP		90.0	0%	-55%	Alto	95	131.54	539.91
olla imusa 6 litros	COP		210.0	24%	86%	Alto	100	162.14	888.78
olla imusa 7 litros	COP		90.0	-20%	33%	Alto	90	124.49	1276.11
olla imusa grande	COP		170.0	0%	0%	Alto	98	134.91	1187.10
olla imusa multifuncional	COP		390.0	182%	23%	Alto	100	268.14	1224.14
olla india grande	COP		50.0	25%	-44%	Alto	81	57.14	640.26
olla indio	COP		390.0	22%	22%	Alto	75	85.11	862.25
olla industrial	COP		140.0	56%	0%	Medio	62	145.65	810.05
olla inoxidable	COP		70.0	25%	-29%	Alto	100	139.26	592.20
olla instant pot	COP		320.0	23%	23%	Alto	100	66.29	795.52
olla inteligente	COP		1000.0	23%	60%	Alto	100	86.63	596.64
olla inteligente imusa	COP		320.0	22%	22%	Alto	100	195.57	1010.67
olla inteligente oster	COP		110.0	89%	89%	Alto	100	143.54	709.13
olla inteligente para cocinar	COP		50.0	133%	40%	Alto	100	134.96	654.42
olla kalley	COP		170.0	50%	133%	Alto	100	354.01	3316.25
olla mediana	COP		110.0	27%	56%	Alto	89	76.45	502.35
olla multichef	COP		260.0	-19%	24%	Alto	100	230.03	1157.61
olla multichef imusa	COP		480.0	-19%	-33%	Alto	100	283.48	1215.89
olla multichef imusa precio	COP		110.0	29%	0%	Alto	95	192.01	839.32
olla multicooker	COP		140.0	56%	0%	Alto	100	124.77	858.93
olla multicooker black and decker	COP		90.0	0%	0%	Alto	95	283.15	1085.58
olla multifuncional	COP		18100.0	49%	49%	Alto	100	118.89	704.80
olla multifuncional black and decker	COP		2400.0	0%	21%	Alto	100	198.10	902.73
olla multifuncional falabella	COP		70.0	40%	40%	Alto	100	238.29	612.32
olla multifuncional hamilton beach	COP		90.0	25%	25%	Alto	100	94.24	819.24
olla multifuncional home elements	COP		480.0	0%	50%	Alto	95	63.37	640.65
olla multifuncional imusa	COP		2900.0	22%	22%	Alto	100	260.69	1192.06
olla multifuncional imusa precio	COP		140.0	22%	-35%	Medio	57	42.09	662.93
olla multifuncional instant pot	COP		170.0	0%	50%	Alto	100	99.44	1060.70
olla multifuncional midea	COP		140.0	23%	52%	Alto	95	124.68	752.81
olla multifuncional ninja	COP		140.0	22%	86%	Alto	98	66.29	491.64
olla multifuncional oster	COP		1900.0	19%	0%	Alto	100	192.63	917.43
olla multifuncional oster precio	COP		90.0	27%	0%	Alto	91	68.64	808.71
olla multifuncional universal	COP		590.0	22%	49%	Alto	97	126.74	902.94
olla multifuncional éxito	COP		260.0	23%	23%	Alto	98	36.28	421.55
olla multiproposito	COP		70.0	22%	57%	Alto	100	106.04	593.48
olla multiuso oster	COP		320.0	23%	0%	Alto	100	163.18	868.63
olla multiusos	COP		1900.0	26%	50%	Alto	100	115.25	786.85
olla multiusos black and decker	COP		390.0	50%	50%	Alto	100	191.56	1050.87
olla multiusos imusa	COP		260.0	22%	22%	Alto	100	224.20	1223.51
olla multiusos oster precio	COP		70.0	-40%	-40%	Alto	100	39.27	430.90
olla ninja	COP		260.0	23%	129%	Alto	97	66.29	596.64
olla oster	COP		260.0	0%	24%	Alto	98	207.61	1068.35
olla oster freidora	COP		260.0	55%	-19%	Alto	99	193.15	867.51
olla oster multifuncional	COP		1900.0	19%	0%	Alto	100	192.63	917.43
olla paellera	COP		90.0	-29%	25%	Alto	100	162.66	695.11
olla paellera 10 royal prestige precio	COP		170.0	67%	-64%	Bajo	16
olla paellera de royal prestige	COP		70.0	22%	57%	Medio	52	31.04	535.92
olla paellera grande	COP		70.0	75%	-22%	Alto	99	99.44	520.43
olla paellera imusa	COP		110.0	33%	-43%	Alto	89	106.12	533.68
olla paellera precio	COP		70.0	80%	29%	Alto	99	46.93	497.15
pailas	COP		720.0	0%	0%	Alto	85	183.87	981.44
pataconera imusa	COP		390.0	22%	0%	Alto	96	108.48	858.95
pitadora	COP		1300.0	0%	0%	Alto	96	90.08	626.63
pitadora electrica	COP		260.0	22%	50%	Alto	97	80.94	668.62
pitadora imusa	COP		720.0	0%	50%	Alto	98	195.59	1022.16
pitadora imusa 6 litros	COP		110.0	0%	40%	Alto	100	165.02	864.49
pitadora royal prestige	COP		140.0	27%	-56%	Alto	87	44.16	575.15
pitadora universal	COP		590.0	0%	22%	Alto	98	92.46	823.53
pitadora universal 6 litros	COP		140.0	-22%	-22%	Alto	99	93.00	791.56
precio de olla arrocera	COP		260.0	21%	0%	Medio	64	32.76	497.20
precio de olla express	COP		70.0	0%	-29%	Alto	100	33.95	513.49
precio de ollas	COP		110.0	-22%	-36%	Alto	99	52.68	505.83
precio de ollas royal prestige	COP		390.0	125%	50%	Alto	78	38.15	572.55
precio olla a presion	COP		170.0	-18%	-18%	Alto	94	34.60	425.33
precio olla express	COP		140.0	0%	-21%	Alto	95	36.74	443.71
precio paellera royal prestige	COP		260.0	86%	86%	Alto	76	30.88	588.13
precio sarten electrico	COP		110.0	0%	-67%	Alto	82	41.73	491.81
prestige ollas	COP		720.0	83%	22%	Alto	95	140.69	662.93
royal ollas	COP		480.0	51%	23%	Alto	92	96.54	613.08
royal prestige bateria	COP		210.0	129%	50%	Alto	97	53.03	589.96
royal prestige olla a presion	COP		210.0	86%	-33%	Alto	93	67.32	596.64
royal prestige olla de presion	COP		320.0	52%	-18%	Alto	86	56.14	596.64
royal prestige olla express	COP		1900.0	116%	-34%	Alto	96	61.82	591.01
royal prestige ollas precio	COP		140.0	120%	-21%	Alto	88	53.53	637.91
royal prestige sartenes	COP		140.0	89%	0%	Alto	83	91.96	596.64
sarten 20 cm	COP		50.0	75%	0%	Alto	100	117.76	1159.15
sarten 24 cm	COP		50.0	25%	-29%	Alto	100	107.24	592.81
sarten 30 cm	COP		50.0	40%	0%	Alto	100	130.20	740.03
sarten 4 puestos	COP		210.0	0%	-36%	Alto	100	155.40	502.32
sarten acero	COP		110.0	56%	-18%	Alto	100	132.59	762.38
sarten acero al carbono	COP		170.0	271%	86%	Alto	98	79.47	590.13
sarten acero inox	COP		2400.0	50%	0%	Alto	100	100.21	707.31
sarten acero inoxidable	COP		2400.0	50%	0%	Alto	100	100.21	707.31
sarten acero inoxidable 18 10	COP		70.0	25%	-29%	Alto	100	92.49	691.45
sarten acero quirurgico	COP		390.0	86%	22%	Alto	100	128.00	682.15
sarten aluminio	COP		90.0	29%	-18%	Alto	83	135.81	666.10
sarten aluminio fundido	COP		110.0	-22%	-50%	Alto	100	366.12	1159.19
sarten antiadherente	COP		4400.0	24%	0%	Alto	100	109.53	862.27
sarten antiadherente con tapa	COP		140.0	57%	22%	Alto	100	120.04	570.17
sarten antiadherente grande	COP		90.0	29%	0%	Alto	94	57.19	722.60
sarten antiadherente imusa	COP		880.0	22%	0%	Alto	99	128.92	851.95
sarten antiadherente royal prestige	COP		90.0	29%	0%	Alto	94	50.33	588.64
sarten arepas	COP		90.0	57%	22%	Alto	95	272.13	1976.59
sarten asador	COP		90.0	22%	57%	Alto	90	133.93	1156.31
sarten basculante	COP		140.0	0%	-35%	Bajo	0
sarten bergner	COP		170.0	0%	-46%	Alto	100	82.88	520.93
sarten ceramica	COP		1300.0	23%	0%	Alto	100	100.29	601.86
sarten ceramica antiadherente	COP		210.0	129%	0%	Alto	100	99.44	667.37
sarten con tapa	COP		170.0	0%	-19%	Alto	100	160.48	777.81
sarten con tapa de vidrio	COP		70.0	40%	40%	Alto	100	92.51	573.72
sarten crepes	COP		90.0	57%	57%	Alto	100	99.44	1011.75
sarten cuadrado	COP		210.0	24%	24%	Alto	90	156.82	741.43
sarten cuadrado con tapa	COP		70.0	40%	40%	Alto	98	180.44	753.15
sarten cuadrado imusa	COP		110.0	0%	-21%	Alto	100	202.82	986.76
sarten cuisinart	COP		50.0	25%	-29%	Alto	100	51.81	1283.78
sarten de acero	COP		210.0	86%	22%	Alto	100	122.14	672.15
sarten de acero al carbono	COP		170.0	271%	86%	Alto	98	79.47	590.13
sarten de acero inoxidable tramontina	COP		30.0	75%	40%	Alto	100	61.60	585.79
sarten de acero quirurgico	COP		390.0	86%	22%	Alto	97	108.87	602.55
sarten de arepas	COP		70.0	0%	29%	Alto	94	42.36	1402.34
sarten de barro	COP		50.0	0%	-44%	Alto	85
sarten de ceramica	COP		1600.0	19%	-21%	Alto	100	99.44	610.93
sarten de cerámica antiadherente	COP		170.0	85%	129%	Alto	100	99.44	583.29
sarten de hierro	COP		880.0	50%	-28%	Alto	98	117.84	780.39
sarten de hierro fundido	COP		3600.0	22%	22%	Alto	100	113.57	800.09
sarten de hierro fundido esmaltado	COP		40.0	40%	40%	Alto	100	165.73	924.84
sarten de hierro fundido victoria	COP		170.0	23%	52%	Alto	100	125.44	913.54
sarten de huevos	COP		50.0	67%	0%	Alto	100	155.69	1276.66
sarten de piedra volcanica	COP		260.0	24%	0%	Alto	91	75.94	530.09
sarten de roca volcanica	COP		50.0	33%	-20%	Alto	85	31.41	299.01
sarten de teflon	COP		390.0	50%	0%	Alto	87	119.42	535.45
sarten de vidrio	COP		170.0	22%	-21%	Alto	92	88.69	580.14
sarten doble	COP		170.0	0%	0%	Alto	100	107.96	762.38
sarten doble cara	COP		110.0	27%	0%	Alto	95	122.80	880.04
sarten doble cara antiadherente	COP		50.0	-25%	-57%	Alto	100	140.55	708.37
sarten doble parrilla	COP		210.0	-18%	0%	Alto	100	98.82	725.04
sarten easy release royal prestige	COP		50.0	100%	-43%	Bajo	17
sarten electrico	COP		1900.0	-19%	-32%	Alto	100	101.92	661.60
sarten electrico black and decker	COP		50.0	40%	75%	Alto	100	172.65	1405.63
sarten electrico home elements	COP		720.0	-33%	-46%	Alto	100	53.88	613.09
sarten electrico home elements precio	COP		90.0	0%	-22%	Medio	37
sarten electrico oster	COP		110.0	40%	0%	Alto	92	70.23	492.60
sarten electrico universal	COP		390.0	24%	0%	Alto	94	81.87	868.89
sarten en acero quirurgico	COP		210.0	86%	53%	Alto	97	116.41	668.86
sarten en ingles	COP		590.0	50%	0%	Bajo	0
sarten exito	COP		110.0	0%	-18%	Alto	96	29.29	363.28
sarten gourmet royal prestige	COP		50.0	29%	80%	Bajo	26
sarten grande	COP		260.0	23%	0%	Alto	95	116.78	849.76
sarten grande para freir	COP		50.0	-29%	0%	Alto	98	114.94	645.24
sarten granito	COP		70.0	40%	-36%	Alto	93	165.73	1019.34
sarten grill	COP		40.0	0%	133%	Alto	88	90.66	831.75
sarten hierro	COP		210.0	50%	-19%	Alto	99	185.70	1020.40
sarten hierro fundido	COP		1300.0	30%	-19%	Alto	100	155.31	1013.16
sarten hierro fundido esmaltado	COP		30.0	0%	25%	Alto	99	190.56	1207.57
sarten hierro fundido victoria	COP		170.0	21%	0%	Alto	100	112.91	1215.66
sarten holstein	COP		50.0	0%	300%	Alto	69
sarten holstein precio	COP		70.0	40%	133%	Bajo	24
sarten home elements	COP		110.0	-29%	-64%	Alto	96	71.05	583.92
sarten homecenter	COP		320.0	22%	0%	Alto	99	43.11	554.56
sarten huevo frito	COP		50.0	33%	-20%	Alto	94	246.96	1253.65
sarten huevos	COP		90.0	56%	100%	Alto	98	252.05	1234.05
sarten imusa 20 cm	COP		170.0	21%	55%	Alto	100	101.38	973.26
sarten imusa 24 cm	COP		320.0	-19%	-19%	Alto	100	90.29	743.55
sarten imusa 24 cm precio	COP		170.0	-71%	-81%	Alto	96	88.99	856.22
sarten imusa 26 cm	COP		70.0	-29%	0%	Alto	100	109.29	1201.01
sarten imusa 30 cm	COP		260.0	0%	-19%	Alto	99	125.57	909.52
sarten imusa con tapa	COP		90.0	0%	-22%	Alto	100	108.21	589.70
sarten imusa talent	COP		90.0	75%	0%	Alto	99	243.92	1041.21
sarten inox	COP		50.0	40%	0%	Alto	98	205.87	716.84
sarten inoxidable	COP		50.0	40%	0%	Alto	98	205.87	716.84
sarten kitchenaid	COP		90.0	56%	0%	Alto	100	99.44	927.43
sarten libre de pfoa y ptfe	COP		70.0	0%	-55%	Alto	96	165.73	675.68
sarten martillado	COP		50.0	-20%	-43%	Alto	100	115.20	576.97
sarten oster	COP		90.0	0%	29%	Alto	93	88.46	750.82
sarten para arepas	COP		320.0	22%	22%	Alto	93	198.88	1060.70
sarten para arepas imusa	COP		210.0	50%	50%	Alto	96	125.64	934.28
sarten para crepas	COP		30.0	25%	0%	Alto	97	69.01	707.70
sarten para freir	COP		210.0	24%	0%	Alto	97	158.64	758.03
sarten para fritar	COP		70.0	22%	22%	Alto	100	70.72	514.41
sarten para huevos	COP		260.0	50%	22%	Alto	96	139.26	889.84
sarten para huevos fritos	COP		70.0	40%	-22%	Alto	100	154.66	762.38
sarten para pancakes	COP		210.0	21%	0%	Alto	100	160.20	1134.37
sarten parrilla	COP		170.0	0%	21%	Alto	100	126.87	796.93
sarten pequeño	COP		110.0	27%	0%	Alto	89	105.04	757.84
sarten piedra	COP		110.0	29%	-18%	Alto	100	193.49	642.82
sarten piedra volcanica	COP		210.0	0%	-33%	Alto	100	132.59	587.49
sarten plancha	COP		140.0	0%	0%	Alto	100	93.55	909.05
sarten plano	COP		50.0	-29%	-29%	Alto	72
sarten precio	COP		70.0	0%	-43%	Alto	100	32.49	413.30
sarten rectangular	COP		50.0	40%	40%	Alto	95	164.19	1782.49
sarten rena ware	COP		90.0	0%	-18%	Alto	92	95.43	645.98
sarten roca volcanica	COP		90.0	0%	-29%	Alto	97	67.89	620.93
sarten tefal acero inoxidable	COP		40.0	-43%	-56%	Alto	99	108.56	847.27
sarten teflon	COP		170.0	0%	-18%	Alto	85	149.37	831.15
sarten tipo wok	COP		40.0	40%	75%	Alto	100	155.20	1106.81
sarten titanio	COP		70.0	180%	100%	Alto	96	99.44	618.78
sarten tramontina	COP		590.0	233%	122%	Alto	100	55.56	571.33
sarten tramontina acero inoxidable	COP		90.0	255%	129%	Alto	100	77.08	577.63
sarten universal con tapa	COP		30.0	0%	133%	Alto	97	94.97	704.13
sarten wok	COP		1000.0	14%	14%	Alto	98	100.53	766.38
sarten wok imusa	COP		110.0	-21%	-35%	Alto	99	103.95	951.29
sarten wok oster	COP		50.0	-43%	300%	Alto	82
sarten wok precio	COP		90.0	75%	40%	Alto	99	32.54	302.28
sartenes	COP		8100.0	83%	49%	Alto	97	148.43	1159.50
sartenes antiadherentes en promoción	COP		210.0	0%	-47%	Alto	100	92.67	623.97
sartenes antiadherentes sin teflon	COP		140.0	0%	-65%	Alto	100	162.02	762.63
sartenes bergner	COP		170.0	0%	-46%	Alto	100	82.88	520.93
sartenes carote	COP		70.0	27%	27%	Alto	99	66.29	580.14
sartenes cuisinart	COP		50.0	25%	-29%	Alto	100	51.81	1283.78
sartenes de acero inoxidable	COP		2400.0	52%	0%	Alto	100	103.78	643.72
sartenes de acero inoxidable 18 10	COP		40.0	40%	75%	Alto	100	122.41	677.71
sartenes de aluminio	COP		210.0	53%	0%	Alto	91	276.91	1467.67
sartenes de aluminio fundido	COP		90.0	57%	57%	Alto	99	301.00	1061.89
sartenes de cerámica ventajas y desventajas	COP		110.0	-18%	-36%	Bajo	30
sartenes de cobre	COP		90.0	0%	-18%	Alto	72	66.29	750.16
sartenes de cocina	COP		70.0	67%	-29%	Alto	89	183.59	4874.37
sartenes de granito	COP		140.0	0%	-46%	Alto	100	92.16	583.29
sartenes de hierro fundido imusa	COP		320.0	23%	-18%	Alto	98	123.01	871.95
sartenes de hierro fundido ventajas y desventajas	COP		50.0	75%	0%	Medio	58	235.11	1657.44
sartenes de imusa	COP		90.0	22%	0%	Alto	100	148.94	1000.94
sartenes de induccion	COP		140.0	55%	0%	Alto	100	160.29	851.84
sartenes de piedra	COP		210.0	86%	53%	Alto	93	156.39	762.38
sartenes de piedra volcánica	COP		260.0	24%	0%	Alto	91	75.94	530.09
sartenes de royal prestige	COP		70.0	120%	57%	Alto	92	38.82	583.29
sartenes de titanio	COP		170.0	555%	555%	Alto	97	99.44	603.40
sartenes de vidrio para cocinar	COP		40.0	33%	-20%	Alto	88	84.50	560.41
sartenes gourmet royal prestige	COP		50.0	29%	80%	Bajo	26
sartenes grandes	COP		260.0	23%	0%	Alto	95	116.78	849.76
sartenes greenpan	COP		30.0	0%	67%	Alto	100	75.84	682.11
sartenes imusa	COP		5400.0	0%	-19%	Alto	100	156.75	985.56
sartenes imusa con tapa precio	COP		110.0	-67%	-67%	Alto	100	99.61	1149.24
sartenes imusa homecenter	COP		70.0	0%	-44%	Alto	95	98.45	425.85
sartenes imusa precio	COP		590.0	0%	-33%	Alto	100	67.95	545.77
sartenes induccion	COP		90.0	-22%	-22%	Alto	100	285.69	1788.81
sartenes industriales	COP		70.0	0%	-29%	Medio	62
sartenes kitchenaid	COP		90.0	56%	0%	Alto	100	99.44	927.43
sartenes la victoria	COP		50.0	40%	-22%	Alto	100	170.10	1465.43
sartenes le creuset	COP		50.0	0%	0%	Alto	87	167.75	2358.32
sartenes libres de pfoa y ptfe	COP		70.0	0%	-55%	Alto	96	165.73	675.68
sartenes ninja	COP		40.0	89%	467%	Alto	96	73.97	762.38
sartenes para estufa de inducción	COP		110.0	0%	-36%	Alto	100	89.03	733.74
sartenes profesionales	COP		70.0	0%	-44%	Alto	100	140.34	636.65
sartenes rena ware precios	COP		40.0	133%	40%	Alto	100
sartenes rosas	COP		70.0	0%	40%	Alto	100	103.67	995.48
sartenes royal prestige	COP		590.0	49%	49%	Alto	94	58.97	590.63
sartenes royal prestige precio	COP		260.0	50%	-19%	Alto	80	42.86	560.41
sartenes saludables	COP		50.0	50%	-40%	Alto	95	198.88	736.76
sartenes sin teflon	COP		140.0	-29%	-55%	Alto	100	170.95	614.62
sartenes t fal	COP		70.0	29%	29%	Alto	94	122.25	1017.13
sartenes tefal	COP		590.0	51%	0%	Alto	100	139.77	1125.15
sartenes tramontina	COP		590.0	233%	122%	Alto	100	55.56	571.33
sartenes tramontina precio	COP		90.0	180%	250%	Alto	100	32.11	364.61
sartenes victoria	COP		1600.0	0%	-21%	Alto	100	167.32	1342.03
sartén de hierro fundido desventajas	COP		140.0	0%	-19%	Bajo	6	87.07	501.83
sartén doble parrilla	COP		40.0	-20%	33%	Alto	96	75.40	523.11
sartén eléctrico home elements	COP		90.0	-21%	22%	Alto	97	41.78	513.49
sartén victoria	COP		1600.0	0%	-21%	Alto	100	167.32	1342.03
swiss home ollas	COP		170.0	-21%	-58%	Alto	100	99.44	664.44
swisshome ollas	COP		140.0	0%	200%	Alto	100	91.84	620.61
t fal ollas	COP		140.0	0%	-21%	Alto	100	215.68	1165.58
t fal sartenes	COP		70.0	29%	29%	Alto	94	122.25	1017.13
tapa de ollas	COP		170.0	0%	0%	Alto	88	65.93	928.11
tapa para ollas	COP		90.0	80%	0%	Alto	100	66.36	640.19
tapa para sarten	COP		40.0	0%	-29%	Alto	97	135.85	821.88
tefal ollas	COP		140.0	55%	21%	Alto	99	132.59	1174.23
tefal sartenes	COP		590.0	51%	0%	Alto	100	139.77	1125.15
teflon sarten	COP		110.0	0%	-36%	Alto	72
termo señal imusa	COP		90.0	29%	0%	Bajo	16
tfal sarten	COP		590.0	51%	0%	Alto	100	139.77	1125.15
tipos de ollas	COP		170.0	27%	-18%	Alto	73
tipos de ollas a presión	COP		50.0	25%	-29%	Alto	91
tipos de sartenes	COP		90.0	100%	27%	Alto	86
tramontina ollas	COP		1000.0	116%	46%	Alto	100	61.96	610.37
tramontina sartenes	COP		170.0	129%	129%	Alto	100	72.48	692.19
una olla arrocera	COP		50.0	33%	-20%	Medio	56
universal ollas	COP		4400.0	0%	0%	Alto	100	128.69	1418.14
universal sartenes	COP		720.0	0%	0%	Alto	95	102.41	1200.81
vaporera de alimentos	COP		1000.0	0%	-38%	Alto	99	99.44	681.15
vaporera de alimentos oster	COP		90.0	75%	-36%	Alto	96	99.44	652.33
vaporera electrica	COP		320.0	0%	0%	Alto	95	106.54	762.38
vaporera oster	COP		260.0	-21%	-66%	Alto	93	165.73	878.19
vaporera oster precio	COP		90.0	0%	-44%	Medio	57	99.44	928.11
vaporera para verduras	COP		90.0	80%	29%	Alto	100	99.44	703.53
victoria sartenes	COP		1000.0	-19%	-19%	Alto	97	260.93	2291.91
victoria sartenes de hierro	COP		70.0	136%	53%	Alto	98	226.73	1611.30
wok acero inoxidable	COP		140.0	-18%	-33%	Alto	96	128.63	596.64
wok antiadherente	COP		50.0	-29%	-29%	Alto	100	102.61	746.91
wok chino	COP		70.0	-29%	-44%	Alto	95
wok cocina	COP		140.0	0%	22%	Alto	89	333.55	1060.09
wok de acero inoxidable	COP		40.0	25%	0%	Alto	84	68.29	666.66
wok electrico	COP		50.0	0%	-20%	Alto	98
wok hierro fundido	COP		50.0	133%	40%	Alto	95	99.44	648.01
wok holstein 30 cm precio	COP		50.0	-40%	Bajo	21
wok imusa	COP		480.0	-18%	-18%	Alto	94	135.68	892.84
wok imusa 30 cm	COP		70.0	-20%	-20%	Alto	100	99.30	702.23
wok olla	COP		90.0	-22%	-50%	Alto	83	162.97	682.27
wok oster	COP		40.0	40%	250%	Alto	96	204.33	1422.59
wok precio	COP		210.0	0%	-33%	Alto	76	41.21	462.98
wok sarten precio	COP		90.0	75%	40%	Alto	99	32.54	302.28
"""

lines = raw_data.strip().split('\n')
header = lines[0].split('\t')
data = []

for line in lines[1:]:
    parts = line.split('\t')
    if len(parts) >= 4:
        kw = parts[0].strip()
        try:
            vol = float(parts[3].replace(',', ''))
        except:
            vol = 0.0
        yoY = parts[5].strip() if len(parts) > 5 else ''
        comp = parts[6].strip() if len(parts) > 6 else ''
        data.append({
            'keyword': kw,
            'volume': int(vol),
            'yoy': yoY,
            'competition': comp
        })

# Sort by volume desc
data.sort(key=lambda x: x['volume'], reverse=True)

# Topic Clusters
clusters = {
    "Ollas a Presión / Express": [],
    "Ollas Arroceras & Vaporeras": [],
    "Baterías de Cocina": [],
    "Sartenes & Antiadherentes": [],
    "Woks & Especiales": [],
    "Hierro Fundido, Barro & Vidrio": [],
    "Ollas Multifuncionales / Eléctricas / Air Fryer": [],
    "Consultas Informativas & Salud / Materiales": []
}

for item in data:
    kw = item['keyword'].lower()
    if 'presion' in kw or 'presión' in kw or 'express' in kw or 'pitadora' in kw:
        clusters["Ollas a Presión / Express"].append(item)
    elif 'arrocera' in kw or 'vaporera' in kw:
        clusters["Ollas Arroceras & Vaporeras"].append(item)
    elif 'bateria' in kw or 'batería' in kw:
        clusters["Baterías de Cocina"].append(item)
    elif 'multifuncional' in kw or 'multichef' in kw or 'multicooker' in kw or 'instant pot' in kw or 'crock pot' in kw or 'airfryer' in kw or 'air fryer' in kw or 'easy fry' in kw or 'coccion lenta' in kw:
        clusters["Ollas Multifuncionales / Eléctricas / Air Fryer"].append(item)
    elif 'wok' in kw:
        clusters["Woks & Especiales"].append(item)
    elif 'hierro' in kw or 'barro' in kw or 'vidrio' in kw or 'peltre' in kw or 'cristal' in kw or 'granito' in kw:
        clusters["Hierro Fundido, Barro & Vidrio"].append(item)
    elif 'sarten' in kw or 'sartén' in kw or 'sartenes' in kw or 'antiadherente' in kw or 'cacerola' in kw or 'paila' in kw or 'paellera' in kw:
        clusters["Sartenes & Antiadherentes"].append(item)
    elif 'toxico' in kw or 'tóxico' in kw or 'pfoa' in kw or 'materiales' in kw or 'mejores' in kw or 'desventajas' in kw or 'ventajas' in kw or 'tipos' in kw:
        clusters["Consultas Informativas & Salud / Materiales"].append(item)
    else:
        clusters["Sartenes & Antiadherentes"].append(item)

report = {
    'total_keywords': len(data),
    'total_search_volume': sum(x['volume'] for x in data),
    'clusters': {}
}

for name, items in clusters.items():
    vol_sum = sum(x['volume'] for x in items)
    top_5 = sorted(items, key=lambda x: x['volume'], reverse=True)[:10]
    report['clusters'][name] = {
        'count': len(items),
        'total_volume': vol_sum,
        'top_keywords': top_5
    }

print(json.dumps(report, indent=2, ensure_ascii=False))
