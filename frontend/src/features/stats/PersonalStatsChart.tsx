import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import styles from './PersonalStatsChart.module.scss';

interface DataPoint {
    name: string;
    value: number;
    color: string;
    isLive?: boolean;
}

interface PersonalStatsChartProps {
    data: DataPoint[];
}

export const PersonalStatsChart = ({data}: PersonalStatsChartProps) => {
    return (
        <div className={styles.chartContainer} data-testid="stats-chart">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="0"/>
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${(value / 60).toFixed(1)}h`}/>
                </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
                {data.map((entry, index) => (
                    <div key={index} className={styles.legendItem}>
                        {entry.isLive && <span className={styles.liveDot} title="Live">●</span>}
                        <span className={styles.dot} style={{backgroundColor: entry.color}}></span>
                        <span>{entry.name}</span>
                        <span className={styles.value}>{(entry.value / 60).toFixed(1)}h</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
