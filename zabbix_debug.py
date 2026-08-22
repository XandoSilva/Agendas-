REGIONAIS_FILTRO = {
    "RJ": ["TERRITORIO: RJ", "TERRITORIO: RIO DE JANEIRO", "-RJ-", "-RJO-"],
    "ES": ["TERRITORIO: ES", "TERRITORIO: ESPIRITO SANTO", "-ES-", "-VIX-"],
    "BA": ["TERRITORIO: BA", "TERRITORIO: BAHIA", "-BA-", "-SSA-"],
    "PR": ["TERRITORIO: PR", "TERRITORIO: PARANA", "-PR-", "-CWB-"]
}
def identify_regional(host, tags):
    text_to_search = (host + " " + tags).upper()
    print("Testando:", text_to_search)
    for regional, keywords in REGIONAIS_FILTRO.items():
        for kw in keywords:
            if kw in text_to_search:
                print("MATCH:", regional, "com a keyword:", kw)
                return regional
    return None

host = "RTIC-01-RJ-RJO-TLP-HW-NE8K"
tags = "Ambiente: CNL, Ambiente: Nacional, Application: Admin status, Application: Operational status, class: network, component: network, interface: 100GE0/10/1, target: huawei, target: huawei-vrp, Territorio: MG, vendor: huawei, Vero"

print("Resultado:", identify_regional(host, tags))
