import pandas as pd

df = pd.read_csv("../reports/report.csv")
df.to_excel("../reports/Microplastic_Report.xlsx", index=False)

print("Report Generated")
