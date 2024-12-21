print('Hi!')

import pandas as pd
pd.read_csv('stats-all-latest.csv').to_pickle('stats-all-latest.pkl')