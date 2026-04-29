import { execFile } from 'child_process';
import {
    BasePlayer,
    Config,
    PlayerType,
    EventType,
    PlayErrorData,
    PlayItem
} from '../types';
import { PlayerFactory } from '../factory';
import log from '../../logger';

export class MpvPlayer extends BasePlayer {
    
    constructor(config: Config) {
        super(config);
    }

    /**
     * 播放媒体列表（已劫持为 PotPlayer）
     */
    async playList(infos: PlayItem[], pos: number, args?: string[]): Promise<boolean> {
        try {
            if (!infos || infos.length === 0) {
                log.error('播放列表为空');
                return false;
            }

            // 获取当前要播放的视频对象
            const currentItem = infos[pos];
            
            // 获取飞牛提供的视频直链
            const videoUrl = currentItem.playLink;
            log.info(`准备调用 PotPlayer 播放地址: ${videoUrl}`);

            // ⚠️ 你的电脑上 PotPlayer 的默认安装路径
            const potPlayerPath = 'C:\\Program Files\\DAUM\\PotPlayer\\PotPlayer64.exe';

            // 启动参数，这里传入视频链接并默认全屏
            const potArgs = [videoUrl, '/fullscreen'];

            // 调用子进程启动 PotPlayer
            execFile(potPlayerPath, potArgs, (error) => {
                if (error) {
                    log.error('PotPlayer 启动失败 (请检查路径是否正确):', error);
                    const errorEvent: PlayErrorData = {
                        message: error.message || error.toString()
                    };
                    this.emitEvent(EventType.ERROR, errorEvent);
                } else {
                    log.info('PotPlayer 播放器已关闭或执行完毕');
                    // 通知客户端播放已结束
                    this.emitEvent(EventType.EXIT, { code: 0, status: this.getStatus() });
                }
            });

            return true;

        } catch (error: any) {
            log.error('PotPlayer 调用失败:', error);
            return false;
        }
    }

    /**
     * 停止播放
     */
    stop(): void {
        log.info('已切换为外置 PotPlayer，需手动关闭播放器窗口。');
        this.emitEvent(EventType.EXIT, { code: 0, status: this.getStatus() });
    }

    /**
     * 检查是否正在播放
     */
    isPlaying(): boolean {
        // 简化逻辑，假装一直在播放状态
        return true;
    }
}

// 依然注册为 MPV 类型，欺骗客户端上层逻辑，使其顺利调用我们修改后的代码
PlayerFactory.registerPlayer(PlayerType.MPV, MpvPlayer);
