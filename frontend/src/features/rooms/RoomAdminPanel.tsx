import {useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import type {Objective} from '../objectives/objectivesSlice';
import {addObjective, deleteObjective, updateObjective,} from '../objectives/objectivesSlice';
import {kickMember} from './roomsSlice';
import styles from './RoomAdminPanel.module.scss';
import {Copy, Edit2, Plus, Save, Target, Trash2, Users, UserX, X} from 'lucide-react';

interface RoomAdminPanelProps {
    roomId: string;
}

export const RoomAdminPanel = ({roomId}: RoomAdminPanelProps) => {
    const dispatch = useAppDispatch();
    const {participantStats} = useAppSelector((state) => state.statistics);
    const {list: objectives} = useAppSelector((state) => state.objectives);

    const [objName, setObjName] = useState('');
    const [objEmoji, setObjEmoji] = useState('🎯');
    const [objColor, setObjColor] = useState('#FF0000');

    const [editingObjId, setEditingObjId] = useState<string | null>(null);
    const [editObjName, setEditObjName] = useState('');
    const [editObjEmoji, setEditObjEmoji] = useState('');
    const [editObjColor, setEditObjColor] = useState('');

    const handleAddObjective = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addObjective({roomId, objective: {name: objName, emoji: objEmoji, color: objColor}}));
        setObjName('');
        setObjEmoji('🎯');
        setObjColor('#FF0000');
    };

    const handleCopyInvite = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Invite link copied!');
    };

    const handleKick = (userId: string) => {
        if (confirm('Are you sure you want to kick this user?')) {
            dispatch(kickMember({roomId, userId}));
        }
    };

    const startEditObjective = (obj: Objective) => {
        setEditingObjId(obj.id);
        setEditObjName(obj.name);
        setEditObjEmoji(obj.emoji);
        setEditObjColor(obj.color);
    };

    const saveEditObjective = () => {
        if (editingObjId) {
            dispatch(updateObjective({
                roomId,
                objectiveId: editingObjId,
                objective: {
                    name: editObjName,
                    emoji: editObjEmoji,
                    color: editObjColor,
                }
            }));
            setEditingObjId(null);
        }
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h3>Room Administration</h3>
                <div className={styles.inviteBox}>
                    <span>Invite Link:</span>
                    <code onClick={handleCopyInvite}>{window.location.href}</code>
                    <button onClick={handleCopyInvite} title="Copy Link"><Copy size={14}/></button>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Target size={18}/>
                        <h4>Manage Objectives</h4>
                    </div>

                    <div className={styles.listContainer}>
                        {objectives.map(obj => (
                            <div key={obj.id} className={styles.listItem}>
                                {editingObjId === obj.id ? (
                                    <div className={styles.editForm}>
                                        <input value={editObjName} onChange={e => setEditObjName(e.target.value)}
                                               placeholder="Name"/>
                                        <div className={styles.editRow}>
                                            <input className={styles.shortInput} value={editObjEmoji}
                                                   onChange={e => setEditObjEmoji(e.target.value)}/>
                                            <input type="color" value={editObjColor}
                                                   onChange={e => setEditObjColor(e.target.value)}/>
                                        </div>
                                        <div className={styles.actions}>
                                            <button onClick={saveEditObjective} className={styles.iconBtn}><Save
                                                size={14}/></button>
                                            <button onClick={() => setEditingObjId(null)} className={styles.iconBtn}><X
                                                size={14}/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.itemInfo}>
                                            <span style={{color: obj.color}}>{obj.emoji}</span>
                                            <span>{obj.name}</span>
                                        </div>
                                        <div className={styles.actions}>
                                            <button onClick={() => startEditObjective(obj)} className={styles.iconBtn}>
                                                <Edit2 size={14}/></button>
                                            <button onClick={() => {
                                                if (confirm('Delete objective?')) dispatch(deleteObjective({
                                                    roomId,
                                                    objectiveId: obj.id
                                                }))
                                            }} className={styles.iconBtnDanger}><Trash2 size={14}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAddObjective} className={styles.compactForm}>
                        <input placeholder="New Objective Name" value={objName}
                               onChange={(e) => setObjName(e.target.value)} required/>
                        <div className={styles.row}>
                            <input value={objEmoji} onChange={(e) => setObjEmoji(e.target.value)}
                                   className={styles.shortInput}/>
                            <input type="color" value={objColor} onChange={(e) => setObjColor(e.target.value)}/>
                            <button type="submit"><Plus size={16}/></button>
                        </div>
                    </form>
                </div>

                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div className={styles.cardHeader}>
                        <Users size={18}/>
                        <h4>Manage Members ({participantStats.length})</h4>
                    </div>
                    <ul className={styles.memberList}>
                        {participantStats.map(member => (
                            <li key={member.user_id}>
                                <span className={styles.memberName}>{member.user_full_name}</span>
                                <button onClick={() => handleKick(member.user_id)} className={styles.kickBtn}
                                        title="Kick User">
                                    <UserX size={14}/> Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
